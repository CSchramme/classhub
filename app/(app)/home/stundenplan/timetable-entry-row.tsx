"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { deleteTimetableEntryAction } from "./actions";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function TimetableEntryRow({
  entry,
  classId,
}: {
  entry: {
    id: string;
    startTime: Date;
    endTime: Date;
    room: string | null;
    teacherName: string | null;
    subject: { name: string };
  };
  classId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <div>
        <span className="font-medium">
          {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
        </span>{" "}
        <span>{entry.subject.name}</span>
        {entry.room && <span className="text-muted-foreground"> · {entry.room}</span>}
        {entry.teacherName && (
          <span className="text-muted-foreground"> · {entry.teacherName}</span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Eintrag löschen"
        disabled={isPending}
        onClick={() =>
          startTransition(() => deleteTimetableEntryAction(entry.id, classId))
        }
      >
        <X className="size-4" />
      </Button>
    </li>
  );
}
