"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialFormActionState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">Vorname</Label>
          <Input id="firstName" name="firstName" autoComplete="given-name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Nachname</Label>
          <Input id="lastName" name="lastName" autoComplete="family-name" required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Anzeigename</Label>
        <Input id="displayName" name="displayName" autoComplete="nickname" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Wird erstellt…" : "Systemadministrator einrichten"}
      </Button>
    </form>
  );
}
