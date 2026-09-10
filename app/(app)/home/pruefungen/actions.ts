"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireClassMember } from "@/lib/auth/authorization";
import { createExam, updateExamStatus, deleteExam } from "@/lib/features/exams";
import { createExamSchema, examStatusSchema } from "@/lib/validation/exam";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createExamAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();

  const parsed = createExamSchema.safeParse({
    classId: formData.get("classId"),
    title: formData.get("title"),
    date: formData.get("date"),
    topics: formData.get("topics") || undefined,
    description: formData.get("description") || undefined,
    subjectId: formData.get("subjectId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await requireClassMember(parsed.data.classId);

  try {
    await createExam(user.id, parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/home/pruefungen");
  return { error: null };
}

export async function setExamStatusAction(examId: string, status: string) {
  const user = await requireUser();
  const parsedStatus = examStatusSchema.parse(status);
  await updateExamStatus(examId, user.id, parsedStatus);
  revalidatePath("/home/pruefungen");
}

export async function deleteExamAction(examId: string) {
  const user = await requireUser();
  await deleteExam(examId, user.id);
  revalidatePath("/home/pruefungen");
}
