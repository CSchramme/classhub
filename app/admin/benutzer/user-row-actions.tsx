"use client";

import { useActionState, useState } from "react";
import {
  toggleUserEnabledAction,
  requirePasswordChangeAction,
  resetSetupAction,
} from "./actions";
import { initialCreateUserActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UserRowActions({
  userId,
  disabled,
}: {
  userId: string;
  disabled: boolean;
}) {
  const [resetState, resetAction, resetPending] = useActionState(
    resetSetupAction,
    initialCreateUserActionState,
  );
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        <form action={toggleUserEnabledAction.bind(null, userId, disabled)}>
          <Button type="submit" size="sm" variant="outline">
            {disabled ? "Aktivieren" : "Deaktivieren"}
          </Button>
        </form>
        <form action={requirePasswordChangeAction.bind(null, userId)}>
          <Button type="submit" size="sm" variant="outline">
            Passwortwechsel erzwingen
          </Button>
        </form>
        <form action={resetAction}>
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" size="sm" variant="outline" disabled={resetPending}>
            Reset auslösen
          </Button>
        </form>
      </div>

      {resetState.setupUrl && (
        <Alert className="max-w-sm">
          <AlertDescription>
            <p className="mb-1 text-xs">Neuer Einrichtungslink:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">
                {resetState.setupUrl}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(resetState.setupUrl!);
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
    </div>
  );
}
