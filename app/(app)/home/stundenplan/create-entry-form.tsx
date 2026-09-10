"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTimetableEntryAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Montag",
  TUESDAY: "Dienstag",
  WEDNESDAY: "Mittwoch",
  THURSDAY: "Donnerstag",
  FRIDAY: "Freitag",
};

export function CreateTimetableEntryForm({
  classId,
  subjects,
}: {
  classId: string;
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createTimetableEntryAction,
    initialFormActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  if (subjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Lege zuerst ein Fach an (siehe „Fächer“), bevor du Stunden einträgst.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="classId" value={classId} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dayOfWeek">Wochentag</Label>
        <Select name="dayOfWeek" defaultValue="MONDAY">
          <SelectTrigger id="dayOfWeek" className="w-full">
            <SelectValue>{(v: string | null) => DAY_LABELS[v ?? "MONDAY"]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DAY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subjectId">Fach</Label>
        <Select name="subjectId" required>
          <SelectTrigger id="subjectId" className="w-full">
            <SelectValue placeholder="Fach wählen">
              {(v: string | null) =>
                subjects.find((s) => s.id === v)?.name ?? "Fach wählen"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startTime">Start</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endTime">Ende</Label>
          <Input id="endTime" name="endTime" type="time" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="room">Raum</Label>
          <Input id="room" name="room" maxLength={50} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="teacherName">Lehrer:in</Label>
          <Input id="teacherName" name="teacherName" maxLength={100} />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird erstellt…" : "Stunde hinzufügen"}
      </Button>
    </form>
  );
}
