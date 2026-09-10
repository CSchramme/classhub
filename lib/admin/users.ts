import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { isUniqueConstraintViolation, getViolatedConstraintIndex } from "@/lib/db-errors";
import { issueSetupToken } from "@/lib/auth/setup-token";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import type { z } from "zod";
import type { createUserSchema } from "@/lib/validation/user";

export async function createUser(
  input: z.infer<typeof createUserSchema>,
  actorUserId: string,
): Promise<{ userId: string; setupToken: string }> {
  let user;
  try {
    user = await db.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: input.displayName,
        email: input.email,
        role: input.role,
        status: "PENDING_SETUP",
        schoolId: input.schoolId,
        createdByUserId: actorUserId,
      },
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new AppError("INVALID_INPUT", "Diese E-Mail-Adresse wird bereits verwendet.");
    }
    throw error;
  }

  if (input.classId) {
    await db.classMembership.create({
      data: { userId: user.id, classId: input.classId },
    });
    await writeAuditLog("USER_ASSIGNED_TO_CLASS", {
      actorUserId,
      targetUserId: user.id,
      metadata: { classId: input.classId },
    });
  }

  if (input.aiAccess) {
    await db.userPermission.create({
      data: { userId: user.id, key: "AI_ACCESS", grantedByUserId: actorUserId },
    });
    await writeAuditLog("AI_ACCESS_GRANTED", { actorUserId, targetUserId: user.id });
  }

  await writeAuditLog("USER_CREATED", {
    actorUserId,
    targetUserId: user.id,
    metadata: { role: input.role },
  });

  const setupToken = await issueSetupToken(user.id);

  return { userId: user.id, setupToken };
}

export async function disableUser(userId: string, actorUserId: string) {
  await db.user.update({ where: { id: userId }, data: { status: "DISABLED" } });
  await destroyAllSessionsForUser(userId);
  await writeAuditLog("USER_DISABLED", { actorUserId, targetUserId: userId });
}

export async function enableUser(userId: string, actorUserId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });
  await db.user.update({
    where: { id: userId },
    data: { status: user.passwordHash ? "ACTIVE" : "PENDING_SETUP" },
  });
  await writeAuditLog("USER_ENABLED", { actorUserId, targetUserId: userId });
}

export async function requirePasswordChange(userId: string, actorUserId: string) {
  await db.user.update({
    where: { id: userId },
    data: { status: "PASSWORD_CHANGE_REQUIRED" },
  });
  await destroyAllSessionsForUser(userId);
  await writeAuditLog("PASSWORD_CHANGE_REQUIRED", { actorUserId, targetUserId: userId });
}

/** Issues a fresh setup link (e.g. the original expired) and resets the
 * account to PENDING_SETUP. Existing sessions are killed so a lost/leaked
 * old session can't linger alongside the reset. */
export async function resetUserSetup(
  userId: string,
  actorUserId: string,
): Promise<string> {
  await db.user.update({ where: { id: userId }, data: { status: "PENDING_SETUP" } });
  await destroyAllSessionsForUser(userId);
  await writeAuditLog("PASSWORD_RESET_REQUESTED", { actorUserId, targetUserId: userId });
  return issueSetupToken(userId);
}

export async function setAiAccess(userId: string, actorUserId: string, granted: boolean) {
  if (granted) {
    await db.userPermission.upsert({
      where: { userId_key: { userId, key: "AI_ACCESS" } },
      create: { userId, key: "AI_ACCESS", grantedByUserId: actorUserId },
      update: {},
    });
    await writeAuditLog("AI_ACCESS_GRANTED", { actorUserId, targetUserId: userId });
  } else {
    await db.userPermission.deleteMany({ where: { userId, key: "AI_ACCESS" } });
    await writeAuditLog("AI_ACCESS_REVOKED", { actorUserId, targetUserId: userId });
  }
}

export async function removeUserFromClass(
  userId: string,
  classId: string,
  actorUserId: string,
) {
  const membership = await db.classMembership.findFirst({
    where: { userId, classId, leftAt: null },
  });
  if (!membership) {
    throw new AppError("NOT_FOUND", "Mitgliedschaft nicht gefunden.");
  }
  await db.classMembership.update({
    where: { id: membership.id },
    data: { leftAt: new Date() },
  });
  await writeAuditLog("USER_REMOVED_FROM_CLASS", {
    actorUserId,
    targetUserId: userId,
    metadata: { classId },
  });
}

export async function assignUserToClass(
  userId: string,
  classId: string,
  actorUserId: string,
) {
  try {
    await db.classMembership.create({ data: { userId, classId } });
  } catch (error) {
    if (
      getViolatedConstraintIndex(error) === "ClassMembership_one_active_per_user_class"
    ) {
      throw new AppError(
        "INVALID_INPUT",
        "Dieser Benutzer ist bereits Mitglied dieser Klasse.",
      );
    }
    throw error;
  }
  await writeAuditLog("USER_ASSIGNED_TO_CLASS", {
    actorUserId,
    targetUserId: userId,
    metadata: { classId },
  });
}

export async function listUsers() {
  return db.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      school: { select: { id: true, name: true } },
      permissions: { select: { key: true } },
      classMemberships: {
        where: { leftAt: null },
        select: { class: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
}

/** Unlike listUsers, includes past (leftAt set) memberships too — a
 * detail view is exactly where that history is useful, not just active
 * status (spec §17: leftAt preserves history rather than hard-deleting). */
export async function getUserDetail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      school: { select: { id: true, name: true } },
      createdBy: { select: { id: true, displayName: true } },
      permissions: { select: { key: true } },
      classMemberships: {
        orderBy: { joinedAt: "desc" },
        select: {
          joinedAt: true,
          leftAt: true,
          class: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (!user) return null;

  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const auditLog = await db.auditLog.findMany({
    where: { OR: [{ actorUserId: userId }, { targetUserId: userId }] },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      actor: { select: { displayName: true } },
      target: { select: { displayName: true } },
    },
  });

  return { user, auditLog };
}
