import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { createNotificationsForUsers } from "@/lib/notifications";
import type { z } from "zod";
import type {
  createHomeworkSchema,
  homeworkStatusSchema,
} from "@/lib/validation/homework";

/** Personal homework (authored by the user, no class) plus homework shared
 * with any class the user currently belongs to (spec §19/§28). */
export async function listHomeworkForUser(userId: string, classIds: string[]) {
  return db.homework.findMany({
    where: {
      OR: [
        { authorId: userId, classId: null },
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
      ],
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      subject: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      author: { select: { displayName: true } },
    },
  });
}

export async function listHomeworkForClass(classId: string) {
  return db.homework.findMany({
    where: { classId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      subject: { select: { id: true, name: true } },
      author: { select: { displayName: true } },
    },
  });
}

export async function createHomework(
  authorId: string,
  input: z.infer<typeof createHomeworkSchema>,
) {
  const homework = await db.homework.create({
    data: {
      authorId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      priority: input.priority,
      subjectId: input.subjectId,
      classId: input.classId,
    },
  });

  if (homework.classId) {
    const members = await db.classMembership.findMany({
      where: { classId: homework.classId, leftAt: null, userId: { not: authorId } },
      select: { userId: true },
    });
    await createNotificationsForUsers(
      members.map((m) => m.userId),
      {
        type: "HOMEWORK_CREATED",
        title: "Neue Hausaufgabe",
        body: homework.title,
        link: "/home/hausaufgaben",
      },
    );
  }

  return homework;
}

async function requireHomeworkAuthor(homeworkId: string, userId: string) {
  const homework = await db.homework.findUnique({
    where: { id: homeworkId },
    select: { authorId: true },
  });
  if (!homework || homework.authorId !== userId) {
    throw new AppError("NOT_FOUND", "Hausaufgabe nicht gefunden.");
  }
}

export async function updateHomeworkStatus(
  homeworkId: string,
  userId: string,
  status: z.infer<typeof homeworkStatusSchema>,
) {
  await requireHomeworkAuthor(homeworkId, userId);
  return db.homework.update({ where: { id: homeworkId }, data: { status } });
}

export async function deleteHomework(homeworkId: string, userId: string) {
  await requireHomeworkAuthor(homeworkId, userId);
  await db.homework.delete({ where: { id: homeworkId } });
}
