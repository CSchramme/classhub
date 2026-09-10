"use server";

import { revalidatePath } from "next/cache";
import { requireSystemAdmin } from "@/lib/auth/authorization";
import { createClass, archiveClass, reactivateClass } from "@/lib/admin/classes";
import { removeUserFromClass } from "@/lib/admin/users";
import { createClassSchema } from "@/lib/validation/school";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createClassAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireSystemAdmin();

  const parsed = createClassSchema.safeParse({
    schoolId: formData.get("schoolId"),
    schoolYearId: formData.get("schoolYearId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await createClass(parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/admin/klassen");
  return { error: null };
}

export async function toggleClassArchiveAction(classId: string, archived: boolean) {
  await requireSystemAdmin();
  if (archived) {
    await reactivateClass(classId);
  } else {
    await archiveClass(classId);
  }
  revalidatePath("/admin/klassen");
}

export async function removeUserFromClassAction(userId: string, classId: string) {
  const admin = await requireSystemAdmin();
  await removeUserFromClass(userId, classId, admin.id);
  revalidatePath(`/admin/klassen/${classId}`);
}
