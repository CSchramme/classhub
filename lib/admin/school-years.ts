import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { isUniqueConstraintViolation } from "@/lib/db-errors";
import type { z } from "zod";
import type { createSchoolYearSchema } from "@/lib/validation/school";

export async function createSchoolYear(input: z.infer<typeof createSchoolYearSchema>) {
  try {
    return await db.schoolYear.create({
      data: {
        schoolId: input.schoolId,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
      },
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new AppError(
        "INVALID_INPUT",
        "Dieses Schuljahr existiert für diese Schule bereits.",
      );
    }
    throw error;
  }
}

export async function archiveSchoolYear(schoolYearId: string) {
  return db.schoolYear.update({
    where: { id: schoolYearId },
    data: { status: "ARCHIVED" },
  });
}

export async function reactivateSchoolYear(schoolYearId: string) {
  return db.schoolYear.update({
    where: { id: schoolYearId },
    data: { status: "ACTIVE" },
  });
}

export async function listSchoolYears() {
  return db.schoolYear.findMany({
    orderBy: [{ school: { name: "asc" } }, { startDate: "desc" }],
    include: {
      school: { select: { id: true, name: true } },
      _count: { select: { classes: true } },
    },
  });
}
