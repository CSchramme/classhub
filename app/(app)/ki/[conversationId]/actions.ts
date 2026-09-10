"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { requireAiAccess } from "@/lib/ai/access";
import { assertWithinBudget } from "@/lib/ai/budget";
import { isAiRateLimited, recordAiMessage } from "@/lib/ai/rate-limit";
import { sendMessage } from "@/lib/ai/chat";
import { confirmProposedAction, cancelProposedAction } from "@/lib/ai/confirm";
import { getUserClassMemberships } from "@/lib/classes";
import { toActionError } from "@/lib/errors";
import type { FormActionState } from "@/lib/action-state";

export async function sendMessageAction(
  conversationId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    return { error: "Bitte gib eine Nachricht ein." };
  }
  if (content.length > 4000) {
    return { error: "Die Nachricht ist zu lang (max. 4000 Zeichen)." };
  }

  // sendMessage() saves the user's message as its first step, before it
  // ever calls the AI — so even when it throws later (API down, etc.),
  // that message is already persisted. revalidatePath has to run on every
  // path out of this function, or the page keeps showing its stale,
  // pre-send state: the message looks like it vanished (it didn't), and a
  // retry from the still-filled textarea would duplicate it.
  let result: FormActionState;
  try {
    await requireAiAccess(user.id);
    await assertWithinBudget(user.id);
    if (isAiRateLimited(user.id)) {
      result = {
        error: "Du hast das stündliche Nachrichtenlimit erreicht. Bitte warte etwas.",
      };
    } else {
      const memberships = await getUserClassMemberships(user.id);
      const classIds = memberships.map((m) => m.class.id);
      await sendMessage(user, conversationId, classIds, content);
      recordAiMessage(user.id);
      result = { error: null };
    }
  } catch (error) {
    result = { error: toActionError(error).message };
  }

  revalidatePath(`/ki/${conversationId}`);
  revalidatePath("/ki");
  return result;
}

export async function confirmActionAction(
  messageId: string,
): Promise<{ error: string | null }> {
  const user = await requireUser();
  try {
    await confirmProposedAction(user.id, messageId);
  } catch (error) {
    return { error: toActionError(error).message };
  }
  // The confirmed proposal may have created a Todo or Event — revalidate
  // where those would show up too, not just the chat itself.
  revalidatePath("/ki", "layout");
  revalidatePath("/home");
  revalidatePath("/home/todos");
  revalidatePath("/home/termine");
  return { error: null };
}

export async function cancelActionAction(
  messageId: string,
): Promise<{ error: string | null }> {
  const user = await requireUser();
  try {
    await cancelProposedAction(user.id, messageId);
  } catch (error) {
    return { error: toActionError(error).message };
  }
  revalidatePath("/ki", "layout");
  return { error: null };
}
