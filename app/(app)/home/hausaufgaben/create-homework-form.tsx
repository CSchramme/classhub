"use client";

import { useActionState, useRef, useEffect } from "react";
import { createHomeworkAction } from "./actions";
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

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
};

export function CreateHomeworkForm({
  subjects,
  classes,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createHomeworkAction,
    initialFormActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" required maxLength={200} autoFocus />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Beschreibung</Label>
        <Input id="description" name="description" maxLength={2000} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Fällig am</Label>
          <Input id="dueDate" name="dueDate" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority">Priorität</Label>
          <Select name="priority" defaultValue="MEDIUM">
            <SelectTrigger id="priority" className="w-full">
              <SelectValue>
                {(v: string | null) => PRIORITY_LABELS[v ?? "MEDIUM"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Niedrig</SelectItem>
              <SelectItem value="MEDIUM">Mittel</SelectItem>
              <SelectItem value="HIGH">Hoch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {subjects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subjectId">Fach</Label>
            <Select name="subjectId">
              <SelectTrigger id="subjectId" className="w-full">
                <SelectValue placeholder="Keins">
                  {(v: string | null) =>
                    subjects.find((s) => s.id === v)?.name ?? "Keins"
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
        )}
        {classes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="classId">Sichtbarkeit</Label>
            <Select name="classId">
              <SelectTrigger id="classId" className="w-full">
                <SelectValue placeholder="Nur ich">
                  {(v: string | null) =>
                    v
                      ? `Klasse ${classes.find((c) => c.id === v)?.name ?? ""}`
                      : "Nur ich"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {classes.map((klass) => (
                  <SelectItem key={klass.id} value={klass.id}>
                    Klasse {klass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird erstellt…" : "Hausaufgabe hinzufügen"}
      </Button>
    </form>
  );
}
