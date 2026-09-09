"use server";

import { revalidatePath } from "next/cache";
import { requireSystemAdmin } from "@/lib/auth/authorization";
import {
  createSchoolYear,
  archiveSchoolYear,
  reactivateSchoolYear,
} from "@/lib/admin/school-years";
import { createSchoolYearSchema } from "@/lib/validation/school";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createSchoolYearAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireSystemAdmin();

  const parsed = createSchoolYearSchema.safeParse({
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await createSchoolYear(parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/admin/schuljahre");
  return { error: null };
}

export async function toggleSchoolYearArchiveAction(
  schoolYearId: string,
  archived: boolean,
) {
  await requireSystemAdmin();
  if (archived) {
    await reactivateSchoolYear(schoolYearId);
  } else {
    await archiveSchoolYear(schoolYearId);
  }
  revalidatePath("/admin/schuljahre");
}
