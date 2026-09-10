import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { z } from "zod";
import type { createEventSchema } from "@/lib/validation/event";

export async function listEventsForUser(
  userId: string,
  classIds: string[],
  schoolId: string | null,
) {
  return db.event.findMany({
    where: {
      OR: [
        { authorId: userId, visibility: "PERSONAL" },
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
        ...(schoolId ? [{ schoolId }] : []),
      ],
    },
    orderBy: { startsAt: "asc" },
    include: {
      class: { select: { id: true, name: true } },
      school: { select: { id: true, name: true } },
      author: { select: { displayName: true } },
    },
  });
}

export async function createEvent(
  authorId: string,
  input: z.infer<typeof createEventSchema>,
) {
  return db.event.create({
    data: {
      authorId,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      category: input.category,
      visibility: input.visibility,
      classId: input.visibility === "CLASS" ? input.classId : undefined,
      schoolId: input.visibility === "SCHOOL" ? input.schoolId : undefined,
    },
  });
}

export async function deleteEvent(eventId: string, userId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { authorId: true },
  });
  if (!event || event.authorId !== userId) {
    throw new AppError("NOT_FOUND", "Termin nicht gefunden.");
  }
  await db.event.delete({ where: { id: eventId } });
}
