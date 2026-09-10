"use client";

import { useActionState, useRef, useEffect } from "react";
import { createExamAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateExamForm({
  classes,
  subjects,
}: {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createExamAction,
    initialFormActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  if (classes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Dir ist noch keine Klasse zugewiesen — Prüfungen sind klassengebunden.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {classes.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="classId">Klasse</Label>
          <Select name="classId" required>
            <SelectTrigger id="classId" className="w-full">
              <SelectValue placeholder="Klasse wählen">
                {(v: string | null) =>
                  classes.find((c) => c.id === v)?.name ?? "Klasse wählen"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classes.map((klass) => (
                <SelectItem key={klass.id} value={klass.id}>
                  {klass.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <input type="hidden" name="classId" value={classes[0].id} />
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="Mathe-Klausur"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">Datum</Label>
        <Input id="date" name="date" type="datetime-local" required />
      </div>

      {subjects.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subjectId">Fach</Label>
          <Select name="subjectId">
            <SelectTrigger id="subjectId" className="w-full">
              <SelectValue placeholder="Keins">
                {(v: string | null) => subjects.find((s) => s.id === v)?.name ?? "Keins"}
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="topics">Themen</Label>
        <Textarea id="topics" name="topics" maxLength={1000} rows={2} />
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird erstellt…" : "Prüfung hinzufügen"}
      </Button>
    </form>
  );
}
