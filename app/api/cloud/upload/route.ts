import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireClassMember } from "@/lib/auth/authorization";
import { uploadFile } from "@/lib/storage";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage/constants";
import { toActionError, statusForErrorCode } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { createNotificationsForUsers } from "@/lib/notifications";
import type { StorageOwner } from "@/lib/storage/types";

/** Server-proxied upload (spec §33): this route validates size/MIME and
 * quota before anything touches storage — never a presigned direct-to-S3
 * upload, which would leave those checks to the client. */
export async function POST(request: NextRequest) {
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch (error) {
    const { code, message } = toActionError(error);
    return NextResponse.json({ error: message }, { status: statusForErrorCode(code) });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const file = formData.get("file");
  const classId = formData.get("classId");
  const folderIdRaw = formData.get("folderId");
  const folderId =
    typeof folderIdRaw === "string" && folderIdRaw.length > 0 ? folderIdRaw : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Die Datei ist leer." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Die Datei ist zu groß (max. ${Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))} MB).`,
      },
      { status: 400 },
    );
  }

  let owner: StorageOwner;
  if (typeof classId === "string" && classId.length > 0) {
    try {
      await requireClassMember(classId);
    } catch (error) {
      const { code, message } = toActionError(error);
      return NextResponse.json({ error: message }, { status: statusForErrorCode(code) });
    }
    owner = { type: "class", id: classId };
  } else {
    owner = { type: "user", id: userId };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const created = await uploadFile({
      owner,
      uploadedByUserId: userId,
      folderId,
      originalFilename: file.name || "Datei",
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      body: buffer,
    });

    await writeAuditLog("FILE_UPLOADED", {
      actorUserId: userId,
      metadata: {
        fileId: created.id,
        filename: created.originalFilename,
        sizeBytes: created.sizeBytes.toString(),
      },
    });

    if (owner.type === "class") {
      const members = await db.classMembership.findMany({
        where: { classId: owner.id, leftAt: null, userId: { not: userId } },
        select: { userId: true },
      });
      await createNotificationsForUsers(
        members.map((m) => m.userId),
        {
          type: "CLOUD_ACTIVITY",
          title: "Neue Datei in der Klassen-Cloud",
          body: created.originalFilename,
          link: "/cloud/klasse",
        },
      );
    }

    return NextResponse.json({ ok: true, fileId: created.id });
  } catch (error) {
    const { code, message } = toActionError(error);
    return NextResponse.json({ error: message }, { status: statusForErrorCode(code) });
  }
}
