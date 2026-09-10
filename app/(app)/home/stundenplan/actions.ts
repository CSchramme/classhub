"use server";

import { revalidatePath } from "next/cache";
import { requireClassMember, requireUser } from "@/lib/auth/authorization";
import { createTimetableEntry, deleteTimetableEntry } from "@/lib/features/timetable";
import { createTimetableEntrySchema } from "@/lib/validation/timetable";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createTimetableEntryAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const classId = String(formData.get("classId"));
  await requireClassMember(classId);

  const parsed = createTimetableEntrySchema.safeParse({
    classId,
    subjectId: formData.get("subjectId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    room: formData.get("room") || undefined,
    teacherName: formData.get("teacherName") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await createTimetableEntry(parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/home/stundenplan");
  return { error: null };
}

export async function deleteTimetableEntryAction(entryId: string, classId: string) {
  await requireUser();
  await requireClassMember(classId);
  await deleteTimetableEntry(entryId);
  revalidatePath("/home/stundenplan");
}
