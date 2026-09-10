import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { z } from "zod";
import type { createTimetableEntrySchema } from "@/lib/validation/timetable";

function timeStringToDate(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

export async function listTimetableForClass(classId: string) {
  return db.timetableEntry.findMany({
    where: { classId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { subject: { select: { id: true, name: true } } },
  });
}

export async function createTimetableEntry(
  input: z.infer<typeof createTimetableEntrySchema>,
) {
  return db.timetableEntry.create({
    data: {
      classId: input.classId,
      subjectId: input.subjectId,
      dayOfWeek: input.dayOfWeek,
      startTime: timeStringToDate(input.startTime),
      endTime: timeStringToDate(input.endTime),
      room: input.room,
      teacherName: input.teacherName,
    },
  });
}

/** classId is required here, not just entryId: without scoping the lookup
 * to the caller's own (already membership-checked) class, any class
 * member could delete any other class's timetable entry by id alone. */
export async function deleteTimetableEntry(entryId: string, classId: string) {
  const entry = await db.timetableEntry.findFirst({
    where: { id: entryId, classId },
    select: { id: true },
  });
  if (!entry) {
    throw new AppError("NOT_FOUND", "Eintrag nicht gefunden.");
  }
  await db.timetableEntry.delete({ where: { id: entryId } });
}
