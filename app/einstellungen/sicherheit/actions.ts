"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { changePassword } from "@/lib/auth/change-password";
import { changePasswordSchema } from "@/lib/validation/auth";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function changePasswordAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireAuthenticatedUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (error) {
    return { error: toActionError(error).message };
  }

  // changePassword destroys every session, this one included — the cookie
  // is now orphaned, so send the user to log in again with the new password
  // rather than rendering a page their own session can no longer access.
  redirect("/login?password-changed=1");
}
