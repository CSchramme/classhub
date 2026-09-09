"use server";

import { revalidatePath } from "next/cache";
import { requireClassMember } from "@/lib/auth/authorization";
import { createAnnouncement } from "@/lib/classes";
import { createAnnouncementSchema } from "@/lib/validation/announcement";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createAnnouncementAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const classId = String(formData.get("classId"));
  const user = await requireClassMember(classId);

  const parsed = createAnnouncementSchema.safeParse({
    classId,
    title: formData.get("title"),
    content: formData.get("content"),
    expiresAt: formData.get("expiresAt") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await createAnnouncement({ ...parsed.data, authorId: user.id });
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/klasse/[slug]/uebersicht", "page");
  return { error: null };
}
