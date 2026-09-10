import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { z } from "zod";
import type { createExamSchema, examStatusSchema } from "@/lib/validation/exam";

export async function listExamsForUser(classIds: string[]) {
  if (classIds.length === 0) return [];
  return db.exam.findMany({
    where: { classId: { in: classIds } },
    orderBy: { date: "asc" },
    include: {
      subject: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      author: { select: { displayName: true } },
    },
  });
}

export async function createExam(
  authorId: string,
  input: z.infer<typeof createExamSchema>,
) {
  return db.exam.create({
    data: {
      authorId,
      classId: input.classId,
      title: input.title,
      date: input.date,
      topics: input.topics,
      description: input.description,
      subjectId: input.subjectId,
    },
  });
}

async function requireExamAuthor(examId: string, userId: string) {
  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: { authorId: true },
  });
  if (!exam || exam.authorId !== userId) {
    throw new AppError("NOT_FOUND", "Prüfung nicht gefunden.");
  }
}

export async function updateExamStatus(
  examId: string,
  userId: string,
  status: z.infer<typeof examStatusSchema>,
) {
  await requireExamAuthor(examId, userId);
  return db.exam.update({ where: { id: examId }, data: { status } });
}

export async function deleteExam(examId: string, userId: string) {
  await requireExamAuthor(examId, userId);
  await db.exam.delete({ where: { id: examId } });
}
