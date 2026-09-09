"use client";

import { useActionState, useRef, useEffect } from "react";
import { createSchoolAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateSchoolForm() {
  const [state, formAction, isPending] = useActionState(
    createSchoolAction,
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
        <Label htmlFor="name">Name der Schule</Label>
        <Input id="name" name="name" required maxLength={200} />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird erstellt…" : "Schule erstellen"}
      </Button>
    </form>
  );
}
