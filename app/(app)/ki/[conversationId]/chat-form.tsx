"use client";

import { useActionState, useRef, useEffect } from "react";
import { sendMessageAction } from "./actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ChatForm({ conversationId }: { conversationId: string }) {
  const boundAction = sendMessageAction.bind(null, conversationId);
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialFormActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Reset on every completed submission, error included: sendMessageAction
  // persists the user's message before it ever calls the AI, so even a
  // failed reply means the text was already sent — leaving it in the box
  // would just invite an accidental duplicate on retry.
  useEffect(() => {
    if (state !== initialFormActionState && !isPending) {
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
      <div className="flex gap-2">
        <Textarea
          name="content"
          placeholder="Frag die KI etwas…"
          required
          maxLength={4000}
          rows={2}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={isPending} className="self-end">
          {isPending ? "Sendet…" : "Senden"}
        </Button>
      </div>
    </form>
  );
}
