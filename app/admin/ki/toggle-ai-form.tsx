"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setAiGloballyEnabledAction } from "./actions";

export function ToggleAiForm({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={enabled ? "outline" : "default"}
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          setAiGloballyEnabledAction(!enabled);
        })
      }
    >
      {enabled ? "Deaktivieren" : "Aktivieren"}
    </Button>
  );
}
