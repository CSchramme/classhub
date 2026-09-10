"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeUserFromClassAction } from "../actions";

export function RemoveMemberButton({
  userId,
  classId,
}: {
  userId: string;
  classId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          removeUserFromClassAction(userId, classId);
        });
      }}
    >
      Entfernen
    </Button>
  );
}
