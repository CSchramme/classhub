import "server-only";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import type { NotificationType } from "@/generated/prisma/client";

const REMINDER_WINDOW_HOURS = 24;
/** How far back to look for an existing reminder before creating another
 * one for the same thing — must comfortably exceed the cron interval so a
 * daily/hourly run never double-notifies for the same exam/event. */
const DEDUPE_WINDOW_HOURS = 48;

const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );

/** There's no per-reminder foreign key on Notification (just a generic
 * `link`), so "already notified about this" is a heuristic: same user,
 * type, and title within the dedupe window. Good enough since titles
 * embed the specific exam/event name. */
async function alreadyNotified(
  userId: string,
  type: NotificationType,
  title: string,
): Promise<boolean> {
  const existing = await db.notification.findFirst({
    where: {
      userId,
      type,
      title,
      createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_HOURS * 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  return existing !== null;
}

async function notifyOnce(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link: string,
): Promise<boolean> {
  if (await alreadyNotified(userId, type, title)) return false;
  await createNotification(userId, { type, title, body, link });
  return true;
}

async function scanExamReminders(now: Date, windowEnd: Date): Promise<number> {
  const upcomingExams = await db.exam.findMany({
    where: { date: { gte: now, lte: windowEnd }, status: "SCHEDULED" },
    include: { subject: { select: { name: true } } },
  });

  let count = 0;
  for (const exam of upcomingExams) {
    const members = await db.classMembership.findMany({
      where: { classId: exam.classId, leftAt: null },
      select: { userId: true },
    });
    const title = `Prüfung bald: ${exam.title}`;
    const body = exam.subject
      ? `${exam.subject.name}, ${fmtDateTime(exam.date)}`
      : fmtDateTime(exam.date);
    for (const member of members) {
      const created = await notifyOnce(
        member.userId,
        "EXAM_UPCOMING",
        title,
        body,
        "/home/pruefungen",
      );
      if (created) count++;
    }
  }
  return count;
}

async function resolveEventRecipients(event: {
  authorId: string;
  visibility: string;
  classId: string | null;
  schoolId: string | null;
}): Promise<string[]> {
  if (event.visibility === "PERSONAL") {
    return [event.authorId];
  }
  if (event.visibility === "CLASS" && event.classId) {
    const members = await db.classMembership.findMany({
      where: { classId: event.classId, leftAt: null },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }
  if (event.visibility === "SCHOOL" && event.schoolId) {
    const users = await db.user.findMany({
      where: { schoolId: event.schoolId, status: "ACTIVE" },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
  return [];
}

async function scanEventReminders(now: Date, windowEnd: Date): Promise<number> {
  const upcomingEvents = await db.event.findMany({
    where: { startsAt: { gte: now, lte: windowEnd } },
  });

  let count = 0;
  for (const event of upcomingEvents) {
    const recipientIds = await resolveEventRecipients(event);
    const title = `Termin bald: ${event.title}`;
    const body = fmtDateTime(event.startsAt);
    for (const userId of recipientIds) {
      const created = await notifyOnce(
        userId,
        "EVENT_REMINDER",
        title,
        body,
        "/home/termine",
      );
      if (created) count++;
    }
  }
  return count;
}

/**
 * Entry point for app/api/cron/notifications — there's no in-app scheduler,
 * so this only runs when the deployer's own crontab (or host scheduler)
 * calls that endpoint. EXAM_UPCOMING and EVENT_REMINDER are the only two
 * time-based notification types (spec's NotificationType enum); everything
 * else is created synchronously at the point of the triggering action
 * (see lib/features/homework.ts, lib/classes.ts, app/api/cloud/upload).
 */
export async function runReminderScan(): Promise<{
  examReminders: number;
  eventReminders: number;
}> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const examReminders = await scanExamReminders(now, windowEnd);
  const eventReminders = await scanEventReminders(now, windowEnd);

  return { examReminders, eventReminders };
}
