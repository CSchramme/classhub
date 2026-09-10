"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { requireAiAccess } from "@/lib/ai/access";
import { createConversation, deleteConversation } from "@/lib/ai/conversations";

export async function createConversationAction() {
  const user = await requireUser();
  await requireAiAccess(user.id);
  const id = await createConversation(user.id);
  redirect(`/ki/${id}`);
}

export async function deleteConversationAction(conversationId: string) {
  const user = await requireUser();
  await deleteConversation(user.id, conversationId);
  revalidatePath("/ki");
}
