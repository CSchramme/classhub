import "server-only";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { z } from "zod";

/**
 * Confirm-before-mutate (spec §37, docs on AIMessage.proposedAction): the
 * model never writes data directly. Calling one of these tools just
 * captures a proposal on the AIMessage row (actionStatus PENDING) — the
 * actual Todo/Event only gets created if the user explicitly confirms it
 * in the UI (see app/ki/[conversationId]/actions.ts).
 *
 * Deliberately limited to Todo and personal Event for V1: both are
 * simple, owner-only, and need no subject/class guessing. Homework could
 * be added the same way later, but subject/class selection is the kind
 * of thing an LLM is more likely to get wrong.
 */
export const PROPOSE_TODO_TOOL: Tool = {
  name: "propose_todo",
  description:
    "Schlägt dem Nutzer ein neues persönliches To-Do vor. Wird erst erstellt, wenn der Nutzer den Vorschlag ausdrücklich bestätigt.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Kurzer Titel des To-Dos." },
      description: { type: "string", description: "Optionale, längere Beschreibung." },
      dueDate: {
        type: "string",
        description: "Fälligkeitsdatum im Format YYYY-MM-DD, falls sinnvoll.",
      },
      priority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH"],
        description: "Priorität, Standard MEDIUM.",
      },
    },
    required: ["title"],
  },
};

export const PROPOSE_EVENT_TOOL: Tool = {
  name: "propose_event",
  description:
    "Schlägt dem Nutzer einen neuen persönlichen Termin vor. Wird erst erstellt, wenn der Nutzer den Vorschlag ausdrücklich bestätigt.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Kurzer Titel des Termins." },
      description: { type: "string", description: "Optionale Beschreibung." },
      startsAt: { type: "string", description: "Start als ISO-8601-Datum/Zeit." },
      endsAt: { type: "string", description: "Ende als ISO-8601-Datum/Zeit." },
      location: { type: "string", description: "Optionaler Ort." },
    },
    required: ["title", "startsAt", "endsAt"],
  },
};

export const AI_TOOLS: Tool[] = [PROPOSE_TODO_TOOL, PROPOSE_EVENT_TOOL];

/** Shape persisted in AIMessage.proposedAction — validated again on read
 * (defense in depth, even though only lib/ai/chat.ts ever writes it). */
export const proposedActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("TODO"), input: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal("EVENT"), input: z.record(z.string(), z.unknown()) }),
]);
export type ProposedAction = z.infer<typeof proposedActionSchema>;

export function toolNameToActionType(toolName: string): "TODO" | "EVENT" | null {
  if (toolName === "propose_todo") return "TODO";
  if (toolName === "propose_event") return "EVENT";
  return null;
}

/** One-line human summary, used both as the DB fallback content for a
 * tool-only reply (no accompanying text) and as the confirm-card label. */
export function describeProposedAction(action: ProposedAction): string {
  const input = action.input;
  const title = typeof input.title === "string" ? input.title : "Unbenannt";
  if (action.type === "TODO") {
    const due = typeof input.dueDate === "string" ? ` (fällig ${input.dueDate})` : "";
    return `To-Do „${title}“${due}`;
  }
  const starts = typeof input.startsAt === "string" ? input.startsAt : "?";
  return `Termin „${title}“ (${starts})`;
}
