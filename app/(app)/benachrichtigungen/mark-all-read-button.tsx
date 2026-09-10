"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          markAllNotificationsReadAction();
        });
      }}
    >
      Alle als gelesen markieren
    </Button>
  );
}
