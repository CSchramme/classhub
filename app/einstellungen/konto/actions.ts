"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { updateProfile } from "@/lib/features/profile";
import { updateProfileSchema } from "@/lib/validation/user";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function updateProfileAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireAuthenticatedUser();

  const parsed = updateProfileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await updateProfile(user.id, parsed.data);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  revalidatePath("/einstellungen/konto");
  return { error: null };
}
