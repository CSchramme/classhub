"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { verifyLogin } from "@/lib/auth/login";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { toActionError } from "@/lib/errors";
import { isRateLimited, recordAttempt, clearAttempts } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request-ip";
import type { FormActionState } from "@/lib/action-state";

export async function loginAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  // Two buckets, either one enough to block: ip+email catches the normal
  // case, but an attacker can freely claim any X-Forwarded-For value, so
  // an email-only bucket backstops the whole thing regardless of what IP
  // a request claims — brute-forcing one account can't be spread across
  // fabricated IPs to dodge the limiter.
  const ipEmailKey = `login:${ip}:${parsed.data.email}`;
  const emailKey = `login-email:${parsed.data.email}`;
  if (isRateLimited(ipEmailKey) || isRateLimited(emailKey)) {
    return {
      error: "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.",
    };
  }

  try {
    const { userId } = await verifyLogin(parsed.data);
    clearAttempts(ipEmailKey);
    clearAttempts(emailKey);
    await createSession(userId, {
      userAgent: headerList.get("user-agent"),
      ipAddress: ip,
    });
  } catch (error) {
    recordAttempt(ipEmailKey);
    recordAttempt(emailKey);
    return { error: toActionError(error).message };
  }

  redirect("/home");
}
