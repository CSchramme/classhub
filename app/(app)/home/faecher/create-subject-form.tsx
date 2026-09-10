"use client";

import { useActionState, useRef, useEffect } from "react";
import { createSubjectAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateSubjectForm() {
  const [state, formAction, isPending] = useActionState(
    createSubjectAction,
    initialFormActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="name">Neues Fach</Label>
          <Input
            id="name"
            name="name"
            placeholder="Mathematik"
            required
            maxLength={100}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Wird erstellt…" : "Hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
