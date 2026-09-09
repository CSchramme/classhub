"use client";

import { useActionState } from "react";
import { setupPasswordAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SetupForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    setupPasswordAction,
    initialFormActionState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Neues Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          autoFocus
        />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Wird eingerichtet…" : "Passwort festlegen"}
      </Button>
    </form>
  );
}
