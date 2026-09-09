"use client";

import { useActionState, useRef, useEffect } from "react";
import { createClassAction } from "./actions";
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateClassForm({
  schools,
  schoolYears,
}: {
  schools: { id: string; name: string }[];
  schoolYears: { id: string; name: string; school: { id: string; name: string } }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createClassAction,
    initialFormActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const slugEditedRef = useRef(false);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
      slugEditedRef.current = false;
    }
  }, [state, isPending]);

  if (schools.length === 0 || schoolYears.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Lege zuerst eine Schule und ein Schuljahr an, bevor du eine Klasse erstellst.
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
        <Label htmlFor="schoolYearId">Schuljahr</Label>
        <Select name="schoolYearId" required>
          <SelectTrigger id="schoolYearId" className="w-full">
            <SelectValue placeholder="Schuljahr wählen">
              {(value: string | null) => {
                const year = schoolYears.find((y) => y.id === value);
                return year ? `${year.school.name} · ${year.name}` : "Schuljahr wählen";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {schoolYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.school.name} · {year.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="10b"
          required
          maxLength={50}
          onChange={(event) => {
            if (!slugEditedRef.current && slugRef.current) {
              slugRef.current.value = slugify(event.target.value);
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">
          Slug{" "}
          <span className="text-muted-foreground">
            (systemweit eindeutig, für die URL)
          </span>
        </Label>
        <Input
          id="slug"
          name="slug"
          ref={slugRef}
          required
          maxLength={50}
          onChange={(event) => {
            slugEditedRef.current = true;
            const cursor = event.target.selectionStart;
            event.target.value = slugify(event.target.value);
            if (cursor !== null) event.target.setSelectionRange(cursor, cursor);
          }}
        />
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird erstellt…" : "Klasse erstellen"}
      </Button>
    </form>
  );
}
