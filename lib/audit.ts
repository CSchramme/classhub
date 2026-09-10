import "server-only";
import { db } from "@/lib/db";
import type { AuditAction, Prisma } from "../generated/prisma/client";

/**
 * Single write path for audit events (spec §52). `metadata` must never
 * contain passwords, tokens, API keys, or other secrets — callers pass
 * only display-safe context (ids, names, counts).
 */
const AUDIT_LOG_PAGE_SIZE = 50;

export async function listAuditLogs(options: { action?: AuditAction; page?: number }) {
  const page = Math.max(1, options.page ?? 1);
  const where = options.action ? { action: options.action } : {};

  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const total = await db.auditLog.count({ where });
  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * AUDIT_LOG_PAGE_SIZE,
    take: AUDIT_LOG_PAGE_SIZE,
    include: {
      actor: { select: { displayName: true } },
      target: { select: { displayName: true } },
    },
  });

  return { logs, total, page, pageSize: AUDIT_LOG_PAGE_SIZE };
}

export async function writeAuditLog(
  action: AuditAction,
  options: {
    actorUserId?: string | null;
    targetUserId?: string | null;
    metadata?: Prisma.InputJsonValue;
  } = {},
): Promise<void> {
  await db.auditLog.create({
    data: {
      action,
      actorUserId: options.actorUserId ?? null,
      targetUserId: options.targetUserId ?? null,
      metadata: options.metadata,
    },
  });
}
