import "server-only";
import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/client";

export type CreateNotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
};

export async function createNotification(
  userId: string,
  input: CreateNotificationInput,
): Promise<void> {
  await db.notification.create({ data: { userId, ...input } });
}

/** Fan-out to many recipients in one query (e.g. "notify the rest of the
 * class") — a no-op for an empty list rather than an empty createMany call. */
export async function createNotificationsForUsers(
  userIds: string[],
  input: CreateNotificationInput,
): Promise<void> {
  if (userIds.length === 0) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...input })),
  });
}

export async function listNotifications(userId: string, limit = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

const NOTIFICATIONS_PAGE_SIZE = 20;

export async function listNotificationsPage(userId: string, page = 1) {
  const currentPage = Math.max(1, page);
  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const total = await db.notification.count({ where: { userId } });
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * NOTIFICATIONS_PAGE_SIZE,
    take: NOTIFICATIONS_PAGE_SIZE,
  });
  return { notifications, total, page: currentPage, pageSize: NOTIFICATIONS_PAGE_SIZE };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  await db.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
