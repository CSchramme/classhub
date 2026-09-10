"use client";

import Link from "next/link";
import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteConversationAction } from "./actions";

const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );

export function ConversationList({
  conversations,
}: {
  conversations: { id: string; title: string | null; updatedAt: Date }[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <ul>
      {conversations.map((c) => (
        <li
          key={c.id}
          className="flex items-center gap-3 border-b border-border py-2 last:border-0"
        >
          <Link
            href={`/ki/${c.id}`}
            className="flex-1 text-sm font-medium hover:underline"
          >
            {c.title || "Neue Unterhaltung"}
          </Link>
          <span className="text-xs text-muted-foreground">
            {fmtDateTime(c.updatedAt)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Unterhaltung löschen"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                deleteConversationAction(c.id);
              })
            }
          >
            <X className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
