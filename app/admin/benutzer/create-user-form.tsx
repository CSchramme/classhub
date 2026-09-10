"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createUserAction } from "./actions";
import { initialCreateUserActionState } from "@/lib/action-state";
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

type SchoolOption = { id: string; name: string };
type ClassOption = { id: string; name: string; school: { name: string } };

export function CreateUserForm({
  schools,
  classes,
}: {
  schools: SchoolOption[];
  classes: ClassOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    initialCreateUserActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!state.error && !state.setupUrl && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  return (
    <div className="flex flex-col gap-3">
      {state.setupUrl && (
        <Alert>
          <AlertDescription>
            <p className="mb-2">
              Konto erstellt. Teile diesen einmaligen Einrichtungslink mit dem Benutzer
              (er wird nirgendwo sonst angezeigt):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">
                {state.setupUrl}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(state.setupUrl!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Kopiert!" : "Kopieren"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">Vorname</Label>
            <Input id="firstName" name="firstName" required maxLength={100} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Nachname</Label>
            <Input id="lastName" name="lastName" required maxLength={100} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Anzeigename</Label>
          <Input id="displayName" name="displayName" required maxLength={100} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role">Rolle</Label>
          <Select name="role" defaultValue="STUDENT">
            <SelectTrigger id="role" className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  value === "SYSTEM_ADMIN" ? "Systemadministrator" : "Schüler:in"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STUDENT">Schüler:in</SelectItem>
              <SelectItem value="SYSTEM_ADMIN">Systemadministrator</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schoolId">Schule (optional)</Label>
          <Select name="schoolId">
            <SelectTrigger id="schoolId" className="w-full">
              <SelectValue placeholder="Keine">
                {(value: string | null) =>
                  schools.find((s) => s.id === value)?.name ?? "Keine"
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
          <Label htmlFor="classId">Klasse (optional)</Label>
          <Select name="classId">
            <SelectTrigger id="classId" className="w-full">
              <SelectValue placeholder="Keine">
                {(value: string | null) => {
                  const klass = classes.find((c) => c.id === value);
                  return klass ? `${klass.school.name} · ${klass.name}` : "Keine";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classes.map((klass) => (
                <SelectItem key={klass.id} value={klass.id}>
                  {klass.school.name} · {klass.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Wird erstellt…" : "Benutzer erstellen"}
        </Button>
      </form>
    </div>
  );
}
