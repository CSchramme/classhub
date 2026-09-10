"use server";

import { revalidatePath } from "next/cache";
import { requireSystemAdmin } from "@/lib/auth/authorization";
import {
  createUser,
  disableUser,
  enableUser,
  requirePasswordChange,
  resetUserSetup,
  assignUserToClass,
} from "@/lib/admin/users";
import { createUserSchema } from "@/lib/validation/user";
import { toActionError } from "@/lib/errors";
import { env } from "@/lib/env";
import type { CreateUserActionState } from "@/lib/action-state";

export async function createUserAction(
  _prevState: CreateUserActionState,
  formData: FormData,
): Promise<CreateUserActionState> {
  const admin = await requireSystemAdmin();

  const parsed = createUserSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    role: formData.get("role"),
    schoolId: formData.get("schoolId"),
    classId: formData.get("classId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    const { setupToken } = await createUser(parsed.data, admin.id);
    revalidatePath("/admin/benutzer");
    return { error: null, setupUrl: `${env.NEXT_PUBLIC_APP_URL}/setup/${setupToken}` };
  } catch (error) {
    return { error: toActionError(error).message };
  }
}

export async function toggleUserEnabledAction(userId: string, disabled: boolean) {
  const admin = await requireSystemAdmin();
  if (disabled) {
    await enableUser(userId, admin.id);
  } else {
    await disableUser(userId, admin.id);
  }
  revalidatePath("/admin/benutzer");
}

export async function requirePasswordChangeAction(userId: string) {
  const admin = await requireSystemAdmin();
  await requirePasswordChange(userId, admin.id);
  revalidatePath("/admin/benutzer");
}

export async function resetSetupAction(
  _prevState: CreateUserActionState,
  formData: FormData,
): Promise<CreateUserActionState> {
  const admin = await requireSystemAdmin();
  const userId = String(formData.get("userId"));
  const setupToken = await resetUserSetup(userId, admin.id);
  revalidatePath("/admin/benutzer");
  return { error: null, setupUrl: `${env.NEXT_PUBLIC_APP_URL}/setup/${setupToken}` };
}

export async function assignClassAction(_prevState: unknown, formData: FormData) {
  const admin = await requireSystemAdmin();
  const userId = String(formData.get("userId"));
  const classId = String(formData.get("classId"));
  if (!classId) return { error: "Bitte eine Klasse wählen." };
  try {
    await assignUserToClass(userId, classId, admin.id);
  } catch (error) {
    return { error: toActionError(error).message };
  }
  revalidatePath("/admin/benutzer");
  return { error: null };
}
