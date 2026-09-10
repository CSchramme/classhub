// @vitest-environment node
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { confirmProposedAction, cancelProposedAction } from "@/lib/ai/confirm";
import { createTestUser, deleteTestUser } from "@/lib/test-helpers";

async function createPendingTodoMessage(userId: string, title: string) {
  const conversation = await db.aIConversation.create({ data: { userId } });
  return db.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: `To-Do Vorschlag: ${title}`,
      proposedAction: { type: "TODO", input: { title } },
      actionStatus: "PENDING",
    },
  });
}

/**
 * confirmProposedAction/cancelProposedAction (docs/database.md "AI
 * confirm-before-mutate") claim atomically — updateMany with
 * actionStatus: "PENDING" in the WHERE clause, same one-time-use pattern
 * as consumeSetupToken — before creating anything. This proves that
 * actually closes the double-submit race, not just the happy path.
 */
describe("confirmProposedAction", () => {
  it("lets exactly one of two concurrent confirms for the same message succeed", async () => {
    const user = await createTestUser();

    try {
      const message = await createPendingTodoMessage(user.id, "Race-Test-Todo");

      const results = await Promise.allSettled([
        confirmProposedAction(user.id, message.id),
        confirmProposedAction(user.id, message.id),
      ]);

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");
      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      const todos = await db.todo.findMany({
        where: { userId: user.id, title: "Race-Test-Todo" },
      });
      expect(todos).toHaveLength(1);

      const updated = await db.aIMessage.findUniqueOrThrow({ where: { id: message.id } });
      expect(updated.actionStatus).toBe("CONFIRMED");
    } finally {
      await deleteTestUser(user.id);
    }
  });

  it("rejects confirming an already-cancelled message", async () => {
    const user = await createTestUser();

    try {
      const message = await createPendingTodoMessage(user.id, "Cancel-Then-Confirm");
      await cancelProposedAction(user.id, message.id);

      await expect(confirmProposedAction(user.id, message.id)).rejects.toThrow();

      const todos = await db.todo.findMany({
        where: { userId: user.id, title: "Cancel-Then-Confirm" },
      });
      expect(todos).toHaveLength(0);
    } finally {
      await deleteTestUser(user.id);
    }
  });

  it("rejects a proposal that fails create-form validation", async () => {
    const user = await createTestUser();

    try {
      const conversation = await db.aIConversation.create({ data: { userId: user.id } });
      const message = await db.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: "Vorschlag ohne Titel",
          // title is required by createTodoSchema — this simulates the
          // model calling the tool without it, e.g. a malformed response.
          proposedAction: { type: "TODO", input: {} },
          actionStatus: "PENDING",
        },
      });

      await expect(confirmProposedAction(user.id, message.id)).rejects.toThrow();

      const updated = await db.aIMessage.findUniqueOrThrow({ where: { id: message.id } });
      // Still PENDING, not stuck CONFIRMED with nothing created — the
      // atomic claim only happens after validation succeeds.
      expect(updated.actionStatus).toBe("PENDING");
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
