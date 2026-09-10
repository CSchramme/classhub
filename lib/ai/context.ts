import "server-only";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";

const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );

/**
 * A compact text summary of the user's own upcoming data, injected into the
 * system prompt so the assistant can answer "was habe ich diese Woche auf?"
 * style questions with real data instead of guessing. Sequential queries —
 * see lib/storage/index.ts for why concurrent ones are unreliable here.
 */
export async function buildUserContext(
  user: SessionUser,
  classIds: string[],
): Promise<string> {
  const now = new Date();

  const openTodos = await db.todo.findMany({
    where: { userId: user.id, status: { not: "COMPLETED" } },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  const openHomework = await db.homework.findMany({
    where: {
      status: { not: "COMPLETED" },
      OR: [
        { authorId: user.id, classId: null },
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
      ],
    },
    orderBy: { dueDate: "asc" },
    take: 10,
    include: { subject: { select: { name: true } } },
  });

  const upcomingExams =
    classIds.length > 0
      ? await db.exam.findMany({
          where: { classId: { in: classIds }, date: { gte: now }, status: "SCHEDULED" },
          orderBy: { date: "asc" },
          take: 5,
          include: { subject: { select: { name: true } } },
        })
      : [];

  const upcomingEvents = await db.event.findMany({
    where: {
      startsAt: { gte: now },
      OR: [
        { authorId: user.id, visibility: "PERSONAL" },
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
        ...(user.schoolId ? [{ schoolId: user.schoolId }] : []),
      ],
    },
    orderBy: { startsAt: "asc" },
    take: 5,
  });

  const lines: string[] = [];
  lines.push(`Heutiges Datum: ${fmtDate(now)}`);
  lines.push(`Name des Nutzers: ${user.displayName}`);

  lines.push("\nOffene To-Dos:");
  lines.push(
    openTodos.length === 0
      ? "- Keine"
      : openTodos
          .map((t) => `- ${t.title}${t.dueDate ? ` (fällig ${fmtDate(t.dueDate)})` : ""}`)
          .join("\n"),
  );

  lines.push("\nOffene Hausaufgaben:");
  lines.push(
    openHomework.length === 0
      ? "- Keine"
      : openHomework
          .map(
            (h) =>
              `- ${h.title}${h.subject ? ` (${h.subject.name})` : ""}, fällig ${fmtDate(h.dueDate)}`,
          )
          .join("\n"),
  );

  lines.push("\nAnstehende Prüfungen:");
  lines.push(
    upcomingExams.length === 0
      ? "- Keine"
      : upcomingExams
          .map(
            (e) =>
              `- ${e.title}${e.subject ? ` (${e.subject.name})` : ""}, ${fmtDateTime(e.date)}`,
          )
          .join("\n"),
  );

  lines.push("\nAnstehende Termine:");
  lines.push(
    upcomingEvents.length === 0
      ? "- Keine"
      : upcomingEvents.map((e) => `- ${e.title}, ${fmtDateTime(e.startsAt)}`).join("\n"),
  );

  return lines.join("\n");
}
