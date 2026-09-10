// @vitest-environment node
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getViolatedConstraintIndex } from "@/lib/db-errors";
import { disableUser } from "@/lib/admin/users";
import {
  createTestUser,
  createTestSchool,
  createTestClass,
  deleteTestUser,
  deleteTestClass,
  deleteTestSchool,
} from "@/lib/test-helpers";

describe("ClassMembership_one_active_per_user_class partial unique index", () => {
  it("lets exactly one of two concurrent memberships for the same user+class succeed", async () => {
    const school = await createTestSchool();
    const klass = await createTestClass(school.id);
    const user = await createTestUser();

    try {
      const results = await Promise.allSettled([
        db.classMembership.create({ data: { userId: user.id, classId: klass.id } }),
        db.classMembership.create({ data: { userId: user.id, classId: klass.id } }),
      ]);

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(
        getViolatedConstraintIndex((failed[0] as PromiseRejectedResult).reason),
      ).toBe("ClassMembership_one_active_per_user_class");

      const active = await db.classMembership.count({
        where: { userId: user.id, classId: klass.id, leftAt: null },
      });
      expect(active).toBe(1);
    } finally {
      await deleteTestUser(user.id);
      await deleteTestClass(klass.id);
      await deleteTestSchool(school.id);
    }
  });
});

describe("disableUser", () => {
  it("destroys every existing session immediately (instant revocation, spec §9)", async () => {
    const user = await createTestUser();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await db.session.create({
        data: { userId: user.id, tokenHash: `hash-a-${user.id}`, expiresAt: future },
      });
      await db.session.create({
        data: { userId: user.id, tokenHash: `hash-b-${user.id}`, expiresAt: future },
      });
      expect(await db.session.count({ where: { userId: user.id } })).toBe(2);

      await disableUser(user.id, user.id);

      expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
      const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(updated.status).toBe("DISABLED");
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
