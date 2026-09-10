import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireClassMember } from "@/lib/auth/authorization";
import { getDownloadUrl } from "@/lib/storage";
import { db } from "@/lib/db";
import { toActionError, statusForErrorCode } from "@/lib/errors";
import type { StorageOwner } from "@/lib/storage/types";

/** Mints a short-lived presigned GET URL only after a real permission
 * check — the id alone in the URL isn't enough to fetch the file. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  try {
    const user = await requireUser();

    const file = await db.file.findUnique({
      where: { id: fileId },
      select: { ownerUserId: true, ownerClassId: true },
    });
    if (!file) {
      return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
    }

    let owner: StorageOwner;
    if (file.ownerUserId) {
      if (file.ownerUserId !== user.id && user.role !== "SYSTEM_ADMIN") {
        return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
      }
      owner = { type: "user", id: file.ownerUserId };
    } else if (file.ownerClassId) {
      await requireClassMember(file.ownerClassId);
      owner = { type: "class", id: file.ownerClassId };
    } else {
      return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
    }

    const url = await getDownloadUrl(owner, fileId);
    return NextResponse.redirect(url);
  } catch (error) {
    const { code, message } = toActionError(error);
    return NextResponse.json({ error: message }, { status: statusForErrorCode(code) });
  }
}
