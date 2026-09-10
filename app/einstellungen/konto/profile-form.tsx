"use client";

import { useActionState } from "react";
import { updateProfileAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ProfileForm({
  firstName,
  lastName,
  displayName,
  email,
}: {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialFormActionState,
  );
  // Referentially unequal to the initial constant only after a real
  // submission — distinguishes "just saved" from "never submitted yet",
  // since both look like {error: null} otherwise.
  const hasSubmitted = state !== initialFormActionState;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {hasSubmitted && !state.error && !isPending && (
        <Alert>
          <AlertDescription>Gespeichert.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>E-Mail</Label>
        {/* Not an <Input>: there's no email-change/re-verification flow,
            so this is purely informational and never submitted. */}
        <p className="rounded-lg border border-input bg-input/50 px-2.5 py-1.5 text-sm text-muted-foreground">
          {email}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">Vorname</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={firstName}
            required
            maxLength={100}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Nachname</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={lastName}
            required
            maxLength={100}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Anzeigename</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          required
          maxLength={100}
        />
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird gespeichert…" : "Speichern"}
      </Button>
    </form>
  );
}
