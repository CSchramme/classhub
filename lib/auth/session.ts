import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import type { Role, UserStatus } from "../../generated/prisma/client";

const SESSION_COOKIE_NAME = "classhub_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  schoolId: string | null;
};

const SESSION_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  displayName: true,
  role: true,
  status: true,
  schoolId: true,
} as const;

export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<void> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Looks up the session strictly from the database on every call — this is
 * what makes "disable a user" or "delete a session" an instant revocation
 * (spec §9, tests #13/#14), unlike a stateless/JWT session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const session = await db.session.findUnique({
    where: { tokenHash },
    select: { id: true, expiresAt: true, user: { select: SESSION_USER_SELECT } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  if (session.user.status === "DISABLED") {
    return null;
  }

  await db.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return session.user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}
