"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { registerFirstUser } from "@/lib/auth/register";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/auth";
import { toActionError } from "@/lib/errors";
import { isRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request-ip";
import type { FormActionState } from "@/lib/action-state";

export async function registerAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  if (isRateLimited(`register:${ip}`)) {
    return { error: "Zu viele Versuche. Bitte warte einen Moment." };
  }
  recordAttempt(`register:${ip}`);

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    const { userId } = await registerFirstUser(parsed.data);
    await createSession(userId, {
      userAgent: headerList.get("user-agent"),
      ipAddress: ip,
    });
  } catch (error) {
    return { error: toActionError(error).message };
  }

  redirect("/home");
}
