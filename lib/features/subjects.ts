import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { isUniqueConstraintViolation } from "@/lib/db-errors";

export async function listSubjectsForSchool(schoolId: string) {
  return db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } });
}

export async function createSubject(schoolId: string, name: string) {
  try {
    return await db.subject.create({ data: { schoolId, name } });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new AppError(
        "INVALID_INPUT",
        "Dieses Fach existiert für deine Schule bereits.",
      );
    }
    throw error;
  }
}
