import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { isUniqueConstraintViolation } from "@/lib/db-errors";
import type { z } from "zod";
import type { createClassSchema } from "@/lib/validation/school";

export async function createClass(input: z.infer<typeof createClassSchema>) {
  try {
    return await db.class.create({
      data: {
        schoolId: input.schoolId,
        schoolYearId: input.schoolYearId,
        name: input.name,
        slug: input.slug,
      },
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new AppError(
        "INVALID_INPUT",
        `Der Slug „${input.slug}“ wird bereits verwendet. Bitte wähle einen anderen (er muss systemweit eindeutig sein, da die URL kein Schul-/Jahreskürzel enthält).`,
      );
    }
    throw error;
  }
}

export async function archiveClass(classId: string) {
  return db.class.update({ where: { id: classId }, data: { status: "ARCHIVED" } });
}

export async function reactivateClass(classId: string) {
  return db.class.update({ where: { id: classId }, data: { status: "ACTIVE" } });
}

export async function listClasses() {
  return db.class.findMany({
    orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
    include: {
      school: { select: { id: true, name: true } },
      schoolYear: { select: { id: true, name: true } },
      _count: { select: { memberships: { where: { leftAt: null } } } },
    },
  });
}

/** Includes past (leftAt set) memberships too, unlike getClassMembers
 * (lib/classes.ts) — a detail view is where that roster history matters. */
export async function getClassDetail(classId: string) {
  const klass = await db.class.findUnique({
    where: { id: classId },
    include: {
      school: { select: { id: true, name: true } },
      schoolYear: { select: { id: true, name: true } },
    },
  });
  if (!klass) return null;

  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const memberships = await db.classMembership.findMany({
    where: { classId },
    orderBy: [{ leftAt: "asc" }, { joinedAt: "desc" }],
    select: {
      joinedAt: true,
      leftAt: true,
      user: { select: { id: true, displayName: true, email: true, role: true } },
    },
  });
  const homeworkCount = await db.homework.count({ where: { classId } });
  const examCount = await db.exam.count({ where: { classId } });

  return { class: klass, memberships, homeworkCount, examCount };
}
