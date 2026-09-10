"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireClassMember } from "@/lib/auth/authorization";
import {
  createHomework,
  updateHomeworkStatus,
  deleteHomework,
} from "@/lib/features/homework";
import { createHomeworkSchema, homeworkStatusSchema } from "@/lib/validation/homework";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createHomeworkAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();

  const parsed = createHomeworkSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority") || "MEDIUM",
    subjectId: formData.get("subjectId") || undefined,
    classId: formData.get("classId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  if (parsed.data.classId) {
    await requireClassMember(parsed.data.classId);
  }

  try {
    await createHomework(user.id, parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/home/hausaufgaben");
  return { error: null };
}

export async function setHomeworkStatusAction(homeworkId: string, status: string) {
  const user = await requireUser();
  const parsedStatus = homeworkStatusSchema.parse(status);
  await updateHomeworkStatus(homeworkId, user.id, parsedStatus);
  revalidatePath("/home/hausaufgaben");
}

export async function deleteHomeworkAction(homeworkId: string) {
  const user = await requireUser();
  await deleteHomework(homeworkId, user.id);
  revalidatePath("/home/hausaufgaben");
}
