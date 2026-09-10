// @vitest-environment node
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { changePassword } from "@/lib/auth/change-password";
import { verifyPassword } from "@/lib/auth/password";
import { createTestUser, deleteTestUser } from "@/lib/test-helpers";

const CURRENT_PASSWORD = "Test-Passwort-123!"; // matches createTestUser's fixed password

describe("changePassword", () => {
  it("destroys every existing session and sets the new password", async () => {
    const user = await createTestUser();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await db.session.create({
        data: { userId: user.id, tokenHash: `hash-${user.id}`, expiresAt: future },
      });
      expect(await db.session.count({ where: { userId: user.id } })).toBe(1);

      await changePassword(user.id, CURRENT_PASSWORD, "Neues-Passwort-999!");

      expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
      const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(updated.status).toBe("ACTIVE");
      expect(await verifyPassword(updated.passwordHash!, "Neues-Passwort-999!")).toBe(
        true,
      );
      expect(await verifyPassword(updated.passwordHash!, CURRENT_PASSWORD)).toBe(false);
    } finally {
      await deleteTestUser(user.id);
    }
  });

  it("rejects the wrong current password and changes nothing", async () => {
    const user = await createTestUser();

    try {
      await expect(
        changePassword(user.id, "definitely-wrong-password", "Neues-Passwort-999!"),
      ).rejects.toThrow();

      const unchanged = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(await verifyPassword(unchanged.passwordHash!, CURRENT_PASSWORD)).toBe(true);
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
