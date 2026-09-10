import "server-only";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";

/**
 * Requires the current password even when status is PASSWORD_CHANGE_REQUIRED
 * (an admin-forced rotation) — the user still has to prove they know the
 * old one, same as a self-initiated change. All sessions (including the
 * caller's) are destroyed afterward so the new password takes effect
 * everywhere immediately; the caller re-logs in with it.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user.passwordHash || !(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new AppError("UNAUTHORIZED", "Das aktuelle Passwort ist falsch.");
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, status: "ACTIVE" },
  });

  await destroyAllSessionsForUser(userId);
}
