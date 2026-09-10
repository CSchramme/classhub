"use client";

import { useActionState, useState } from "react";
import { createEventAction } from "./actions";
import { initialFormActionState, type FormActionState } from "@/lib/action-state";
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

const VISIBILITY_LABELS: Record<string, string> = {
  PERSONAL: "Persönlich",
  CLASS: "Klasse",
  SCHOOL: "Schule",
};

type ClassOption = { id: string; name: string };
type SchoolOption = { id: string; name: string };

export function CreateEventForm({
  classes,
  schools,
  isSystemAdmin,
}: {
  classes: ClassOption[];
  schools: SchoolOption[];
  isSystemAdmin: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    createEventAction,
    initialFormActionState,
  );

  // Render-time derived reset: bump `resetKey` when a *new*, successful
  // (non-error) action result appears, comparing against the previously
  // seen state by reference. This is React's documented alternative to
  // "sync state in an effect" — safe because it's a conditional setState
  // during render, not inside useEffect (see [[feedback-use-server-exports]]-
  // adjacent gotchas encountered building this app).
  const [prevState, setPrevState] = useState(state);
  const [resetKey, setResetKey] = useState(0);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setResetKey((k) => k + 1);
    }
  }

  return (
    <EventFormFields
      key={resetKey}
      state={state}
      formAction={formAction}
      isPending={isPending}
      classes={classes}
      schools={schools}
      isSystemAdmin={isSystemAdmin}
    />
  );
}

function EventFormFields({
  state,
  formAction,
  isPending,
  classes,
  schools,
  isSystemAdmin,
}: {
  state: FormActionState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  classes: ClassOption[];
  schools: SchoolOption[];
  isSystemAdmin: boolean;
}) {
  const [visibility, setVisibility] = useState("PERSONAL");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" required maxLength={200} autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startsAt">Start</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endsAt">Ende</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Ort</Label>
        <Input id="location" name="location" maxLength={200} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="visibility">Sichtbarkeit</Label>
        <Select
          name="visibility"
          value={visibility}
          onValueChange={(v) => setVisibility(String(v))}
        >
          <SelectTrigger id="visibility" className="w-full">
            <SelectValue>
              {(v: string | null) => VISIBILITY_LABELS[v ?? "PERSONAL"]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERSONAL">Persönlich</SelectItem>
            {classes.length > 0 && <SelectItem value="CLASS">Klasse</SelectItem>}
            {isSystemAdmin && <SelectItem value="SCHOOL">Schule</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {visibility === "CLASS" && (
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
      )}

      {visibility === "SCHOOL" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schoolId">Schule</Label>
          <Select name="schoolId" required>
            <SelectTrigger id="schoolId" className="w-full">
              <SelectValue placeholder="Schule wählen">
                {(v: string | null) =>
                  schools.find((s) => s.id === v)?.name ?? "Schule wählen"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird erstellt…" : "Termin hinzufügen"}
      </Button>
    </form>
  );
}
