import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { z } from "zod";
import type { createSchoolSchema } from "@/lib/validation/school";

export async function createSchool(input: z.infer<typeof createSchoolSchema>) {
  return db.school.create({ data: { name: input.name } });
}

export async function archiveSchool(schoolId: string) {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { id: true },
  });
  if (!school) {
    throw new AppError("NOT_FOUND", "Schule nicht gefunden.");
  }
  return db.school.update({ where: { id: schoolId }, data: { status: "ARCHIVED" } });
}

export async function reactivateSchool(schoolId: string) {
  return db.school.update({ where: { id: schoolId }, data: { status: "ACTIVE" } });
}

export async function listSchools() {
  return db.school.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { classes: true, users: true } } },
  });
}
