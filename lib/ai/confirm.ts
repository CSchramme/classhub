import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { createTodo } from "@/lib/features/todos";
import { createEvent } from "@/lib/features/events";
import { createTodoSchema } from "@/lib/validation/todo";
import { createEventSchema } from "@/lib/validation/event";
import { proposedActionSchema, type ProposedAction } from "@/lib/ai/tools";

async function findPendingAction(
  userId: string,
  messageId: string,
): Promise<ProposedAction> {
  const message = await db.aIMessage.findFirst({
    where: { id: messageId, actionStatus: "PENDING", conversation: { userId } },
  });
  if (!message || !message.proposedAction) {
    throw new AppError("NOT_FOUND", "Vorschlag nicht gefunden oder bereits bearbeitet.");
  }

  const parsed = proposedActionSchema.safeParse(message.proposedAction);
  if (!parsed.success) {
    throw new AppError("INVALID_INPUT", "Der gespeicherte Vorschlag ist ungültig.");
  }
  return parsed.data;
}

/** Atomic claim — same one-time-use pattern as consumeSetupToken
 * (lib/auth/setup-token.ts): actionStatus: "PENDING" in the WHERE clause
 * means only one of two concurrent confirm/cancel calls for the same
 * message can ever flip it, closing the double-submit race a
 * read-then-write check can't. Called only after validation succeeds, so
 * a malformed proposal never leaves a message stuck CONFIRMED with
 * nothing actually created. */
async function claimPendingMessage(
  userId: string,
  messageId: string,
  newStatus: "CONFIRMED" | "CANCELLED",
): Promise<void> {
  const claim = await db.aIMessage.updateMany({
    where: { id: messageId, actionStatus: "PENDING", conversation: { userId } },
    data: { actionStatus: newStatus },
  });
  if (claim.count === 0) {
    throw new AppError("NOT_FOUND", "Vorschlag wurde bereits bearbeitet.");
  }
}

/** Re-validates the stored proposal against the same Zod schemas the real
 * create forms use — the model's tool call is untrusted input, same as any
 * form submission, regardless of how plausible it looked in the chat. */
export async function confirmProposedAction(
  userId: string,
  messageId: string,
): Promise<void> {
  const action = await findPendingAction(userId, messageId);

  if (action.type === "TODO") {
    const parsed = createTodoSchema.safeParse(action.input);
    if (!parsed.success) {
      throw new AppError(
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Ungültiger Vorschlag.",
      );
    }
    await claimPendingMessage(userId, messageId, "CONFIRMED");
    await createTodo(userId, parsed.data);
  } else {
    const parsed = createEventSchema.safeParse({
      ...action.input,
      visibility: "PERSONAL",
    });
    if (!parsed.success) {
      throw new AppError(
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Ungültiger Vorschlag.",
      );
    }
    await claimPendingMessage(userId, messageId, "CONFIRMED");
    await createEvent(userId, parsed.data);
  }
}

export async function cancelProposedAction(
  userId: string,
  messageId: string,
): Promise<void> {
  await findPendingAction(userId, messageId);
  await claimPendingMessage(userId, messageId, "CANCELLED");
}
