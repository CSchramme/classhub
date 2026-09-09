import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";

/**
 * Central authorization helpers (spec §12). Every server action / route
 * handler that needs auth calls one of the `require*` functions below —
 * authorization logic does not get re-implemented ad hoc per route.
 */

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/** Server Actions / Route Handlers: throws a structured AppError. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Du musst angemeldet sein.");
  }
  if (user.status === "PASSWORD_CHANGE_REQUIRED") {
    throw new AppError("FORBIDDEN", "Du musst zuerst dein Passwort ändern.");
  }
  return user;
}

/** Same as requireUser, but allows PASSWORD_CHANGE_REQUIRED through — only
 * the password-change action itself should use this. */
export async function requireAuthenticatedUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Du musst angemeldet sein.");
  }
  return user;
}

export async function requireSystemAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "SYSTEM_ADMIN") {
    throw new AppError("FORBIDDEN", "Nur Systemadministratoren haben Zugriff.");
  }
  return user;
}

/** Server Components (pages/layouts): redirects instead of throwing. */
export async function requireUserOrRedirect(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.status === "PASSWORD_CHANGE_REQUIRED") {
    redirect("/einstellungen/sicherheit?erforderlich=1");
  }
  return user;
}

export async function requireSystemAdminOrRedirect(): Promise<SessionUser> {
  const user = await requireUserOrRedirect();
  if (user.role !== "SYSTEM_ADMIN") {
    redirect("/home");
  }
  return user;
}

/**
 * True membership check, not just "is this class in the user's school" —
 * a user only has class access via an active ClassMembership row (spec
 * §17/§27: no fetching another class's data through a guessed slug/id).
 */
export async function requireClassMember(classId: string): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "SYSTEM_ADMIN") {
    return user;
  }
  const membership = await db.classMembership.findFirst({
    where: { userId: user.id, classId, leftAt: null },
    select: { id: true },
  });
  if (!membership) {
    throw new AppError("FORBIDDEN", "Du bist kein Mitglied dieser Klasse.");
  }
  return user;
}
