"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { deleteEventAction } from "./actions";

const VISIBILITY_LABELS: Record<string, string> = {
  PERSONAL: "Persönlich",
  CLASS: "Klasse",
  SCHOOL: "Schule",
};

export function EventItem({
  event,
  currentUserId,
}: {
  event: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    location: string | null;
    visibility: string;
    authorId: string;
    author: { displayName: string };
    class: { name: string } | null;
    school: { name: string } | null;
  };
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isAuthor = event.authorId === currentUserId;
  const fmt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <li className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <div className="flex-1">
        <p className="font-medium">{event.title}</p>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant="outline">
            {fmt.format(event.startsAt)} – {fmt.format(event.endsAt)}
          </Badge>
          {event.location && <Badge variant="outline">{event.location}</Badge>}
          <Badge variant="secondary">
            {event.class
              ? `Klasse ${event.class.name}`
              : event.school
                ? event.school.name
                : VISIBILITY_LABELS[event.visibility]}
          </Badge>
          {!isAuthor && <Badge variant="outline">von {event.author.displayName}</Badge>}
        </div>
      </div>
      {isAuthor && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Termin löschen"
          disabled={isPending}
          onClick={() => startTransition(() => deleteEventAction(event.id))}
        >
          <X className="size-4" />
        </Button>
      )}
    </li>
  );
}
