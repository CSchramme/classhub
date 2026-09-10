import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { Role, UserStatus } from "@/generated/prisma/client";

/** Fixture helpers shared by the integration tests under lib/**\/*.test.ts
 * (see lib/auth/register.test.ts and friends). Not a test file itself —
 * just creation/cleanup for real rows in a real Postgres database, since
 * the race conditions these tests cover can only be proven against one. */

let counter = 0;
function unique(): string {
  counter += 1;
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestSchool() {
  return db.school.create({ data: { name: `Testschule ${unique()}` } });
}

export async function createTestClass(schoolId: string) {
  const schoolYear = await db.schoolYear.create({
    data: {
      name: `Testjahr ${unique()}`,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2027-07-31"),
      schoolId,
    },
  });
  return db.class.create({
    data: {
      name: `Testklasse ${unique()}`,
      slug: `test-${unique()}`,
      schoolId,
      schoolYearId: schoolYear.id,
    },
  });
}

export async function createTestUser(
  overrides: Partial<{ role: Role; status: UserStatus; schoolId: string | null }> = {},
) {
  const passwordHash = await hashPassword("Test-Passwort-123!");
  return db.user.create({
    data: {
      email: `test-${unique()}@example.test`,
      firstName: "Test",
      lastName: "User",
      displayName: "Test User",
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      ...overrides,
    },
  });
}

/** User, Session, SetupToken, ClassMembership, and UserPermission all
 * cascade from User (onDelete: Cascade in the schema), so deleting the
 * user is enough cleanup for anything created off it. */
export async function deleteTestUser(userId: string) {
  await db.user.delete({ where: { id: userId } }).catch(() => {});
}

export async function deleteTestClass(classId: string) {
  await db.class.delete({ where: { id: classId } }).catch(() => {});
}

export async function deleteTestSchool(schoolId: string) {
  await db.school.delete({ where: { id: schoolId } }).catch(() => {});
}
