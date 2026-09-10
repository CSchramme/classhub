"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { markAsRead, markAllAsRead } from "@/lib/notifications";

/** Shared across the Topbar's dropdown and the full /benachrichtigungen
 * page (lib/, not under one route) — same precedent as
 * lib/auth/logout-action.ts. */
export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();
  await markAsRead(user.id, notificationId);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await markAllAsRead(user.id);
  revalidatePath("/", "layout");
}
