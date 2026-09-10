"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { setHomeworkStatusAction, deleteHomeworkAction } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  COMPLETED: "Erledigt",
};
const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "COMPLETED"];

export function HomeworkItem({
  homework,
  currentUserId,
}: {
  homework: {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date;
    priority: string;
    status: string;
    subject: { name: string } | null;
    class: { name: string } | null;
    authorId: string;
    author: { displayName: string };
  };
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isAuthor = homework.authorId === currentUserId;
  const nextStatus =
    STATUS_ORDER[(STATUS_ORDER.indexOf(homework.status) + 1) % STATUS_ORDER.length];

  return (
    <li className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <div className="flex-1">
        <p className="font-medium">{homework.title}</p>
        {homework.description && (
          <p className="text-sm text-muted-foreground">{homework.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant="outline">
            {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
              homework.dueDate,
            )}
          </Badge>
          {homework.subject && <Badge variant="outline">{homework.subject.name}</Badge>}
          {homework.class && (
            <Badge variant="secondary">Klasse {homework.class.name}</Badge>
          )}
          {!isAuthor && (
            <Badge variant="outline">von {homework.author.displayName}</Badge>
          )}
        </div>
      </div>
      {isAuthor ? (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(() => setHomeworkStatusAction(homework.id, nextStatus))
            }
          >
            {STATUS_LABELS[homework.status]}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Hausaufgabe löschen"
            disabled={isPending}
            onClick={() => startTransition(() => deleteHomeworkAction(homework.id))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Badge variant={homework.status === "COMPLETED" ? "secondary" : "outline"}>
          {STATUS_LABELS[homework.status]}
        </Badge>
      )}
    </li>
  );
}
