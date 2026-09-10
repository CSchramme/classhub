"use client";

import { useActionState, useRef, useEffect } from "react";
import { FolderPlus } from "lucide-react";
import { createFolderAction } from "../actions";
import { initialFormActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateFolderForm({
  classId,
  parentFolderId,
  returnPath,
}: {
  classId: string | null;
  parentFolderId: string | null;
  returnPath: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createFolderAction,
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
      {classId && <input type="hidden" name="classId" value={classId} />}
      {parentFolderId && (
        <input type="hidden" name="parentFolderId" value={parentFolderId} />
      )}
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="flex gap-2">
        <Input name="name" placeholder="Ordnername" required maxLength={100} />
        <Button type="submit" disabled={isPending} variant="outline">
          <FolderPlus className="size-4" />
          {isPending ? "…" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
