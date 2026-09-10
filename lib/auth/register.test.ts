// @vitest-environment node
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getViolatedConstraintIndex } from "@/lib/db-errors";
import { hashPassword } from "@/lib/auth/password";

/**
 * registerFirstUser (spec §6, test #3) relies on the database itself —
 * not application logic — to guarantee at most one SYSTEM_ADMIN ever
 * exists: `User_one_system_admin` is a partial unique index
 * (`UNIQUE(role) WHERE role = 'SYSTEM_ADMIN'`, see docs/database.md).
 * registerFirstUser's own bootstrap gate (`count() === 0`) can't be
 * exercised here without disturbing this shared dev database, which
 * already has users from manual testing — the database-level invariant
 * is what actually makes the function safe, so that's what this proves
 * directly: two concurrent inserts racing for the same constraint, same
 * as two concurrent bootstrap requests would.
 */
describe("User_one_system_admin partial unique index", () => {
  it("lets exactly one of two concurrent SYSTEM_ADMIN inserts succeed", async () => {
    const passwordHash = await hashPassword("Test-Passwort-123!");
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const emailA = `race-a-${suffix}@example.test`;
    const emailB = `race-b-${suffix}@example.test`;
    const baseData = {
      firstName: "Race",
      lastName: "Admin",
      displayName: "Race Admin",
      passwordHash,
      role: "SYSTEM_ADMIN" as const,
      status: "ACTIVE" as const,
    };

    // Temporarily clear any existing SYSTEM_ADMIN so the race has a real
    // empty slot to contend for; restored in `finally` regardless of
    // outcome — including a thrown assertion, which is why cleanup below
    // never depends on how far the try block got.
    const existingAdmins = await db.user.findMany({
      where: { role: "SYSTEM_ADMIN" },
      select: { id: true },
    });
    if (existingAdmins.length > 0) {
      await db.user.updateMany({
        where: { role: "SYSTEM_ADMIN" },
        data: { role: "STUDENT" },
      });
    }

    try {
      const results = await Promise.allSettled([
        db.user.create({ data: { ...baseData, email: emailA } }),
        db.user.create({ data: { ...baseData, email: emailB } }),
      ]);

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(
        getViolatedConstraintIndex((failed[0] as PromiseRejectedResult).reason),
      ).toBe("User_one_system_admin");

      const admins = await db.user.findMany({ where: { role: "SYSTEM_ADMIN" } });
      expect(admins).toHaveLength(1);
    } finally {
      // Always runs, success or thrown assertion: delete by the known
      // emails (not `results`, which may not exist if Promise.allSettled
      // itself never resolved usably) so a failed assertion can never
      // leave a race candidate behind to collide with the restore below.
      await db.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
      for (const admin of existingAdmins) {
        await db.user
          .update({ where: { id: admin.id }, data: { role: "SYSTEM_ADMIN" } })
          .catch(() => {});
      }
    }
  });
});
