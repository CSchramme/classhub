import "server-only";
import { db } from "@/lib/db";
import type { AuditAction, Prisma } from "../generated/prisma/client";

/**
 * Single write path for audit events (spec §52). `metadata` must never
 * contain passwords, tokens, API keys, or other secrets — callers pass
 * only display-safe context (ids, names, counts).
 */
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
