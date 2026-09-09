import "server-only";
import { db } from "@/lib/db";
import { getViolatedConstraintIndex, isUniqueConstraintViolation } from "@/lib/db-errors";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { registerSchema } from "@/lib/validation/auth";
import type { z } from "zod";

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Bootstrap registration (spec §6/§7): only reachable while zero users
 * exist. Once any user exists, public registration is closed for good —
 * everyone after that is created by a SYSTEM_ADMIN (Phase 4).
 *
 * Race safety: the `count() > 0` guard below has its own tiny race window
 * by design — two concurrent bootstrap requests can both pass it. What
 * makes the outcome safe is the database itself: `User_one_system_admin`
 * (a partial unique index added by hand in the initial migration, see
 * docs/database.md) means at most one of the two SYSTEM_ADMIN inserts can
 * ever succeed. The loser's insert throws a unique-constraint violation,
 * which we catch here and retry as STUDENT — both users end up created,
 * exactly one of them SYSTEM_ADMIN, never both (spec §6 test #3).
 *
 * Pure business logic, no next/headers dependency — directly unit-testable
 * (see lib/auth/register.test.ts). The caller ("use server" action) is
 * responsible for calling createSession() afterwards to log the user in.
 */
export async function registerFirstUser(
  input: RegisterInput,
): Promise<{ userId: string; role: "SYSTEM_ADMIN" | "STUDENT" }> {
  const existingUserCount = await db.user.count();
  if (existingUserCount > 0) {
    throw new AppError(
      "FORBIDDEN",
      "Die Registrierung ist geschlossen. Bitte wende dich an deine Schule.",
    );
  }

  const passwordHash = await hashPassword(input.password);
  const baseData = {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    displayName: input.displayName,
    passwordHash,
    status: "ACTIVE" as const,
  };

  let userId: string;
  let role: "SYSTEM_ADMIN" | "STUDENT";

  try {
    const user = await db.user.create({
      data: { ...baseData, role: "SYSTEM_ADMIN" },
      select: { id: true },
    });
    userId = user.id;
    role = "SYSTEM_ADMIN";
  } catch (error) {
    if (getViolatedConstraintIndex(error) === "User_one_system_admin") {
      const user = await db.user.create({
        data: { ...baseData, role: "STUDENT" },
        select: { id: true },
      });
      userId = user.id;
      role = "STUDENT";
    } else if (isUniqueConstraintViolation(error)) {
      // Email collision from a concurrent bootstrap attempt with the same address.
      throw new AppError("INVALID_INPUT", "Diese E-Mail-Adresse wird bereits verwendet.");
    } else {
      throw error;
    }
  }

  await writeAuditLog("USER_CREATED", {
    actorUserId: userId,
    targetUserId: userId,
    metadata: { role, via: "bootstrap" },
  });

  return { userId, role };
}
