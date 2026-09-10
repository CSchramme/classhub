import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

export async function listConversations(userId: string) {
  return db.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function createConversation(userId: string): Promise<string> {
  const conversation = await db.aIConversation.create({ data: { userId } });
  return conversation.id;
}

export async function getConversation(userId: string, conversationId: string) {
  const conversation = await db.aIConversation.findFirst({
    where: { id: conversationId, userId },
  });
  if (!conversation) {
    throw new AppError("NOT_FOUND", "Unterhaltung nicht gefunden.");
  }
  return conversation;
}

export async function getConversationMessages(userId: string, conversationId: string) {
  const conversation = await getConversation(userId, conversationId);
  const messages = await db.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return { conversation, messages };
}

export async function deleteConversation(userId: string, conversationId: string) {
  await getConversation(userId, conversationId);
  await db.aIConversation.delete({ where: { id: conversationId } });
}
