import "server-only";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getAiClient } from "@/lib/ai/client";
import { buildUserContext } from "@/lib/ai/context";
import {
  AI_TOOLS,
  toolNameToActionType,
  describeProposedAction,
  type ProposedAction,
} from "@/lib/ai/tools";
import { estimateCostEur } from "@/lib/ai/pricing";
import type { SessionUser } from "@/lib/auth/session";
import type { Prisma } from "@/generated/prisma/client";

const SYSTEM_PROMPT = `Du bist der KI-Assistent von ClassHub, einer Schulplattform. Du hilfst Schüler:innen beim Organisieren von Hausaufgaben, To-Dos, Terminen und Prüfungen. Antworte auf Deutsch, klar und freundlich.

Wenn der Nutzer möchte, dass etwas festgehalten wird (ein To-Do oder ein Termin), nutze das passende Werkzeug (propose_todo / propose_event) statt es nur im Text zu beschreiben — der Nutzer bestätigt den Vorschlag danach selbst in der Oberfläche. Erfinde keine Daten, die du nicht kennst; wenn etwas unklar ist, frag nach.

Kontext über den Nutzer (aktuell, direkt aus der Datenbank):`;

const MAX_TOKENS = 1024;

/**
 * Not looped back into the model as a real tool_use/tool_result pair on
 * later turns — each stored message is reconstructed as plain user/
 * assistant text (see the fallback `content` below). That sidesteps
 * Anthropic's tool-use turn-pairing requirement entirely, at the minor
 * cost of the model seeing a paraphrase rather than the literal structured
 * call in later turns — an acceptable simplification given the live
 * context block already reflects whatever the user actually confirmed.
 */
export async function sendMessage(
  user: SessionUser,
  conversationId: string,
  classIds: string[],
  content: string,
): Promise<void> {
  const conversation = await db.aIConversation.findFirst({
    where: { id: conversationId, userId: user.id },
  });
  if (!conversation) {
    throw new AppError("NOT_FOUND", "Unterhaltung nicht gefunden.");
  }

  await db.aIMessage.create({ data: { conversationId, role: "USER", content } });

  // updatedAt is set explicitly rather than relying on @updatedAt to kick
  // in on its own: an update() call with an otherwise-empty data object
  // turned out not to bump it (verified empirically) — probably optimized
  // away as a no-op query. Without this, the conversation list sorts by
  // whichever conversation happened to get its title set most recently,
  // not by actual last activity.
  await db.aIConversation.update({
    where: { id: conversationId },
    data: {
      ...(conversation.title ? {} : { title: content.slice(0, 60) }),
      updatedAt: new Date(),
    },
  });

  const history = await db.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  const messages: MessageParam[] = history.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));

  const context = await buildUserContext(user, classIds);
  const client = getAiClient();

  let response;
  try {
    response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      system: `${SYSTEM_PROMPT}\n\n${context}`,
      messages,
      tools: AI_TOOLS,
    });
  } catch (error) {
    console.error("Anthropic API error", error);
    throw new AppError(
      "INTERNAL_ERROR",
      "Die KI ist gerade nicht erreichbar. Bitte versuche es später erneut.",
    );
  }

  const textBlocks = response.content.filter((block) => block.type === "text");
  const toolUseBlock = response.content.find((block) => block.type === "tool_use");
  const replyText = textBlocks.map((block) => block.text).join("\n\n");

  const actionType = toolUseBlock ? toolNameToActionType(toolUseBlock.name) : null;
  const proposedAction: ProposedAction | null =
    actionType && toolUseBlock
      ? ({ type: actionType, input: toolUseBlock.input } as ProposedAction)
      : null;

  await db.aIMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content:
        replyText || (proposedAction ? describeProposedAction(proposedAction) : "…"),
      proposedAction: proposedAction
        ? (proposedAction as unknown as Prisma.InputJsonValue)
        : undefined,
      actionStatus: proposedAction ? "PENDING" : undefined,
    },
  });

  const cost = estimateCostEur(
    env.ANTHROPIC_MODEL,
    response.usage.input_tokens,
    response.usage.output_tokens,
  );
  await db.aIUsageLog.create({
    data: {
      userId: user.id,
      model: env.ANTHROPIC_MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      estimatedCostEur: cost,
    },
  });
}
