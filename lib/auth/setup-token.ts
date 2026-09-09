import "server-only";
import { db } from "@/lib/db";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { AppError } from "@/lib/errors";

const SETUP_TOKEN_DURATION_MS = 72 * 60 * 60 * 1000;

export async function issueSetupToken(userId: string): Promise<string> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SETUP_TOKEN_DURATION_MS);
  await db.setupToken.create({ data: { userId, tokenHash, expiresAt } });
  return rawToken;
}

/** Read-only check for the page to decide what to render. Not the actual
 * enforcement — that's the atomic updateMany in consumeSetupToken below,
 * which is what actually has to be race-safe (spec §8, test #15/#16). */
export async function peekSetupToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const token = await db.setupToken.findUnique({
    where: { tokenHash },
    select: {
      usedAt: true,
      expiresAt: true,
      user: { select: { displayName: true, email: true } },
    },
  });
  if (!token) return { valid: false as const };
  if (token.usedAt) return { valid: false as const, reason: "used" as const };
  if (token.expiresAt < new Date())
    return { valid: false as const, reason: "expired" as const };
  return { valid: true as const, user: token.user };
}

/**
 * One-time use, enforced atomically: `updateMany` with `usedAt: null` in
 * the WHERE clause means only one of two concurrent requests for the same
 * token can ever flip it, at the database level — there's no read-then-write
 * gap for two requests to both slip through.
 */
export async function consumeSetupToken(
  rawToken: string,
  newPassword: string,
): Promise<{ userId: string }> {
  const tokenHash = hashToken(rawToken);

  const claim = await db.setupToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  if (claim.count === 0) {
    throw new AppError("INVALID_INPUT", "Dieser Link ist ungültig oder abgelaufen.");
  }

  const token = await db.setupToken.findUniqueOrThrow({
    where: { tokenHash },
    select: { userId: true },
  });

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: token.userId },
    data: { passwordHash, status: "ACTIVE" },
  });

  return { userId: token.userId };
}
