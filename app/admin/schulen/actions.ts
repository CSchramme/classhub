"use server";

import { revalidatePath } from "next/cache";
import { requireSystemAdmin } from "@/lib/auth/authorization";
import { createSchool, archiveSchool, reactivateSchool } from "@/lib/admin/schools";
import { createSchoolSchema } from "@/lib/validation/school";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createSchoolAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireSystemAdmin();

  const parsed = createSchoolSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await createSchool(parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/admin/schulen");
  return { error: null };
}

export async function toggleSchoolArchiveAction(schoolId: string, archived: boolean) {
  await requireSystemAdmin();
  if (archived) {
    await reactivateSchool(schoolId);
  } else {
    await archiveSchool(schoolId);
  }
  revalidatePath("/admin/schulen");
}
