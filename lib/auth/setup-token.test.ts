// @vitest-environment node
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { issueSetupToken, consumeSetupToken } from "@/lib/auth/setup-token";
import { verifyPassword } from "@/lib/auth/password";
import { createTestUser, deleteTestUser } from "@/lib/test-helpers";

/**
 * consumeSetupToken (spec §8, tests #15/#16) uses an atomic `updateMany`
 * with `usedAt: null` in the WHERE clause — this proves that actually
 * closes the race: two concurrent claims of the same token, only one
 * can ever succeed.
 */
describe("consumeSetupToken", () => {
  it("lets exactly one of two concurrent claims for the same token succeed", async () => {
    const user = await createTestUser({ status: "PENDING_SETUP" });

    try {
      const rawToken = await issueSetupToken(user.id);

      const results = await Promise.allSettled([
        consumeSetupToken(rawToken, "Neues-Passwort-111!"),
        consumeSetupToken(rawToken, "Neues-Passwort-222!"),
      ]);

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");
      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      const token = await db.setupToken.findFirstOrThrow({ where: { userId: user.id } });
      expect(token.usedAt).not.toBeNull();

      // The password that actually got set must match whichever of the
      // two concurrent calls the DB let win — not silently neither.
      const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      const matchesFirst = await verifyPassword(
        updated.passwordHash!,
        "Neues-Passwort-111!",
      );
      const matchesSecond = await verifyPassword(
        updated.passwordHash!,
        "Neues-Passwort-222!",
      );
      expect(matchesFirst || matchesSecond).toBe(true);
      expect(matchesFirst && matchesSecond).toBe(false);
    } finally {
      await deleteTestUser(user.id);
    }
  });

  it("rejects an already-used token", async () => {
    const user = await createTestUser({ status: "PENDING_SETUP" });

    try {
      const rawToken = await issueSetupToken(user.id);
      await consumeSetupToken(rawToken, "Erstes-Passwort-1!");

      await expect(consumeSetupToken(rawToken, "Zweites-Passwort-2!")).rejects.toThrow();
    } finally {
      await deleteTestUser(user.id);
    }
  });

  it("rejects an expired token", async () => {
    const user = await createTestUser({ status: "PENDING_SETUP" });

    try {
      const rawToken = await issueSetupToken(user.id);
      await db.setupToken.updateMany({
        where: { userId: user.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await expect(
        consumeSetupToken(rawToken, "Irgendein-Passwort-1!"),
      ).rejects.toThrow();
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
