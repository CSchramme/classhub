"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { consumeSetupToken } from "@/lib/auth/setup-token";
import { createSession } from "@/lib/auth/session";
import { setupPasswordSchema } from "@/lib/validation/auth";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function setupPasswordAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = setupPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    const { userId } = await consumeSetupToken(parsed.data.token, parsed.data.password);
    const headerList = await headers();
    await createSession(userId, {
      userAgent: headerList.get("user-agent"),
      ipAddress: headerList.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
  } catch (error) {
    return { error: toActionError(error).message };
  }

  redirect("/home");
}
