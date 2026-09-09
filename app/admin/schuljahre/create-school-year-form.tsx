"use client";

import { useActionState, useRef, useEffect } from "react";
import { createSchoolYearAction } from "./actions";
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

export function CreateSchoolYearForm({
  schools,
}: {
  schools: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createSchoolYearAction,
    initialFormActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  if (schools.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Lege zuerst eine Schule an, bevor du ein Schuljahr erstellst.
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schoolId">Schule</Label>
        <Select name="schoolId" required>
          <SelectTrigger id="schoolId" className="w-full">
            <SelectValue placeholder="Schule wählen">
              {(value: string | null) =>
                schools.find((school) => school.id === value)?.name ?? "Schule wählen"
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Bezeichnung</Label>
        <Input id="name" name="name" placeholder="2026/27" required maxLength={50} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Start</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">Ende</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird erstellt…" : "Schuljahr erstellen"}
      </Button>
    </form>
  );
}
