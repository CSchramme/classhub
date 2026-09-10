"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createConversationAction } from "./actions";

export function NewConversationButton() {
  return (
    <form action={createConversationAction}>
      <Button type="submit" size="sm">
        <Plus className="size-4" />
        Neue Unterhaltung
      </Button>
    </form>
  );
}
