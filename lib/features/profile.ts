import "server-only";
import { db } from "@/lib/db";
import type { z } from "zod";
import type { updateProfileSchema } from "@/lib/validation/user";

export async function getSchoolName(schoolId: string): Promise<string | null> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { name: true },
  });
  return school?.name ?? null;
}

export async function getProfileMemberships(userId: string) {
  return db.classMembership.findMany({
    where: { userId, leftAt: null },
    select: {
      joinedAt: true,
      class: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { class: { name: "asc" } },
  });
}

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  return db.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName,
    },
  });
}
