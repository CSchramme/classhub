"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { setExamStatusAction, deleteExamAction } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Geplant",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Abgesagt",
};

export function ExamItem({
  exam,
  currentUserId,
}: {
  exam: {
    id: string;
    title: string;
    date: Date;
    topics: string | null;
    status: string;
    subject: { name: string } | null;
    class: { name: string };
    authorId: string;
    author: { displayName: string };
  };
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isAuthor = exam.authorId === currentUserId;

  return (
    <li className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <div className="flex-1">
        <p className="font-medium">{exam.title}</p>
        {exam.topics && <p className="text-sm text-muted-foreground">{exam.topics}</p>}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant="outline">
            {new Intl.DateTimeFormat("de-DE", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(exam.date)}
          </Badge>
          <Badge variant="secondary">Klasse {exam.class.name}</Badge>
          {exam.subject && <Badge variant="outline">{exam.subject.name}</Badge>}
          {!isAuthor && <Badge variant="outline">von {exam.author.displayName}</Badge>}
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
              startTransition(() =>
                setExamStatusAction(
                  exam.id,
                  exam.status === "SCHEDULED" ? "COMPLETED" : "SCHEDULED",
                ),
              )
            }
          >
            {STATUS_LABELS[exam.status]}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Prüfung löschen"
            disabled={isPending}
            onClick={() => startTransition(() => deleteExamAction(exam.id))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Badge variant="outline">{STATUS_LABELS[exam.status]}</Badge>
      )}
    </li>
  );
}
