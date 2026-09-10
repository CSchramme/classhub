"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { createSubject } from "@/lib/features/subjects";
import { createSubjectSchema } from "@/lib/validation/subject";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function createSubjectAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  if (!user.schoolId) {
    return {
      error: "Dir ist keine Schule zugewiesen. Bitte wende dich an einen Administrator.",
    };
  }

  const parsed = createSubjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await createSubject(user.schoolId, parsed.data.name);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/home/faecher");
  return { error: null };
}
