"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { verifyLogin } from "@/lib/auth/login";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { toActionError } from "@/lib/errors";
import { isRateLimited, recordAttempt, clearAttempts } from "@/lib/auth/rate-limit";
import type { FormActionState } from "@/lib/action-state";

export async function loginAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const rateLimitKey = `login:${ip}:${parsed.data.email}`;
  if (isRateLimited(rateLimitKey)) {
    return {
      error: "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.",
    };
  }

  try {
    const { userId } = await verifyLogin(parsed.data);
    clearAttempts(rateLimitKey);
    await createSession(userId, {
      userAgent: headerList.get("user-agent"),
      ipAddress: ip,
    });
  } catch (error) {
    recordAttempt(rateLimitKey);
    return { error: toActionError(error).message };
  }

  redirect("/home");
}
