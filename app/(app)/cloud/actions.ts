"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireClassMember } from "@/lib/auth/authorization";
import { createFolder, deleteFolder, deleteFile } from "@/lib/storage";
import { createFolderSchema } from "@/lib/validation/storage";
import { toActionError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import type { FormActionState } from "@/lib/action-state";
import type { StorageOwner } from "@/lib/storage/types";

/** classId is client-supplied but never trusted on its own — membership is
 * re-verified here on every call, same as every other class-scoped action
 * in the app (spec §17/§27). */
async function resolveOwner(classId: string | null): Promise<{
  owner: StorageOwner;
  userId: string;
}> {
  const user = await requireUser();
  if (classId) {
    await requireClassMember(classId);
    return { owner: { type: "class", id: classId }, userId: user.id };
  }
  return { owner: { type: "user", id: user.id }, userId: user.id };
}

export async function createFolderAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const classId = (formData.get("classId") as string) || null;
  const returnPath = String(formData.get("returnPath") || "/cloud/privat");

  const parsed = createFolderSchema.safeParse({
    name: formData.get("name"),
    parentFolderId: (formData.get("parentFolderId") as string) || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    const { owner } = await resolveOwner(classId);
    await createFolder(owner, parsed.data.name, parsed.data.parentFolderId);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath(returnPath);
  return { error: null };
}

/** Unlike a todo/homework delete, "folder not empty" is a common, expected
 * rejection here — not a rare race. Caught and returned rather than thrown,
 * so the client can show it inline instead of crashing to the error
 * boundary (Next.js redacts a thrown Server Action error's message anyway). */
export async function deleteFolderAction(
  folderId: string,
  classId: string | null,
  returnPath: string,
): Promise<{ error: string | null }> {
  try {
    const { owner } = await resolveOwner(classId);
    await deleteFolder(owner, folderId);
  } catch (error) {
    return { error: toActionError(error).message };
  }
  revalidatePath(returnPath);
  return { error: null };
}

export async function deleteFileAction(
  fileId: string,
  classId: string | null,
  returnPath: string,
): Promise<{ error: string | null }> {
  try {
    const { owner, userId } = await resolveOwner(classId);
    await deleteFile(owner, fileId);
    await writeAuditLog("FILE_DELETED", { actorUserId: userId, metadata: { fileId } });
  } catch (error) {
    return { error: toActionError(error).message };
  }
  revalidatePath(returnPath);
  return { error: null };
}
