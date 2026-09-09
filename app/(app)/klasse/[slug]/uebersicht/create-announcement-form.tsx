"use client";

import { useActionState, useRef, useEffect } from "react";
import { createAnnouncementAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateAnnouncementForm({ classId }: { classId: string }) {
  const [state, formAction, isPending] = useActionState(
    createAnnouncementAction,
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
      <input type="hidden" name="classId" value={classId} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content">Inhalt</Label>
        <Textarea id="content" name="content" required maxLength={5000} rows={3} />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird veröffentlicht…" : "Ankündigung veröffentlichen"}
      </Button>
    </form>
  );
}
