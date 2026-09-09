import "server-only";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { AppError } from "@/lib/errors";
import { loginSchema } from "@/lib/validation/auth";
import type { z } from "zod";

export type LoginInput = z.infer<typeof loginSchema>;

const GENERIC_LOGIN_ERROR = "E-Mail oder Passwort ist falsch.";

/**
 * Pure business logic (no next/headers) — see register.ts for why. Always
 * returns the same generic error for "no such user" vs "wrong password" vs
 * "disabled", so login can't be used to enumerate which emails exist or
 * probe account status.
 */
export async function verifyLogin(input: LoginInput): Promise<{ userId: string }> {
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!user || !user.passwordHash) {
    // Still hash something to keep timing roughly consistent whether or
    // not the account exists / has a password yet.
    await verifyPassword(
      "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      input.password,
    ).catch(() => false);
    throw new AppError("UNAUTHORIZED", GENERIC_LOGIN_ERROR);
  }

  if (user.status === "DISABLED") {
    throw new AppError("UNAUTHORIZED", GENERIC_LOGIN_ERROR);
  }

  if (user.status === "PENDING_SETUP") {
    throw new AppError(
      "UNAUTHORIZED",
      "Dieses Konto wurde noch nicht eingerichtet. Bitte nutze den Link, den du von deiner Schule erhalten hast.",
    );
  }

  const passwordValid = await verifyPassword(user.passwordHash, input.password);
  if (!passwordValid) {
    throw new AppError("UNAUTHORIZED", GENERIC_LOGIN_ERROR);
  }

  return { userId: user.id };
}
