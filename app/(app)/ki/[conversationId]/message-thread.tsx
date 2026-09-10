import { cn } from "@/lib/utils";
import { proposedActionSchema, describeProposedAction } from "@/lib/ai/tools";
import { ProposedActionCard } from "./proposed-action-card";
import type { AiMessageRole, AiActionStatus } from "@/generated/prisma/client";

const fmtTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { timeStyle: "short" }).format(date);

export function MessageThread({
  messages,
}: {
  messages: {
    id: string;
    role: AiMessageRole;
    content: string;
    proposedAction: unknown;
    actionStatus: AiActionStatus | null;
    createdAt: Date;
  }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((m) => {
        const isUser = m.role === "USER";
        const parsedAction = m.actionStatus
          ? proposedActionSchema.safeParse(m.proposedAction)
          : null;

        return (
          <div
            key={m.id}
            className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                isUser ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {m.content}
            </div>
            <span className="text-xs text-muted-foreground">{fmtTime(m.createdAt)}</span>
            {m.actionStatus && parsedAction?.success && (
              <ProposedActionCard
                messageId={m.id}
                status={m.actionStatus}
                summary={describeProposedAction(parsedAction.data)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
