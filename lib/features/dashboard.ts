import "server-only";
import { db } from "@/lib/db";

const DAY_KEYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export async function getDashboardData(
  userId: string,
  classIds: string[],
  schoolId: string | null,
) {
  const todayKey = DAY_KEYS[new Date().getDay()];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  // Sequential, not Promise.all: this page alone issues six queries, and
  // running them concurrently intermittently exhausted the connection pool
  // against the local dev database (surfaced as "Connection terminated
  // unexpectedly"). One dashboard load isn't latency-sensitive enough for
  // six-way concurrency to be worth that fragility.
  const todayTimetable =
    todayKey !== "SUNDAY" && todayKey !== "SATURDAY" && classIds.length > 0
      ? await db.timetableEntry.findMany({
          where: { classId: { in: classIds }, dayOfWeek: todayKey as "MONDAY" },
          orderBy: { startTime: "asc" },
          include: { subject: { select: { name: true } } },
        })
      : [];

  const openHomework = await db.homework.findMany({
    where: {
      status: { not: "COMPLETED" },
      OR: [
        { authorId: userId, classId: null },
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
      ],
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    include: { subject: { select: { name: true } } },
  });

  const openTodos = await db.todo.findMany({
    where: { userId, status: { not: "COMPLETED" } },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  const nextExam =
    classIds.length > 0
      ? await db.exam.findFirst({
          where: { classId: { in: classIds }, date: { gte: now }, status: "SCHEDULED" },
          orderBy: { date: "asc" },
          include: { subject: { select: { name: true } } },
        })
      : null;

  const todayEvents = await db.event.findMany({
    where: {
      startsAt: { gte: startOfToday, lt: startOfTomorrow },
      OR: [
        { authorId: userId, visibility: "PERSONAL" },
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
        ...(schoolId ? [{ schoolId }] : []),
      ],
    },
    orderBy: { startsAt: "asc" },
  });

  const upcomingEvents = await db.event.findMany({
    where: {
      startsAt: { gte: startOfTomorrow },
      OR: [
        { authorId: userId, visibility: "PERSONAL" },
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
        ...(schoolId ? [{ schoolId }] : []),
      ],
    },
    orderBy: { startsAt: "asc" },
    take: 5,
  });

  return {
    todayTimetable,
    openHomework,
    openTodos,
    nextExam,
    todayEvents,
    upcomingEvents,
  };
}
