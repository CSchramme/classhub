"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmActionAction, cancelActionAction } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  CANCELLED: "Abgelehnt",
};

export function ProposedActionCard({
  messageId,
  status,
  summary,
}: {
  messageId: string;
  status: string;
  summary: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{summary}</span>
        <Badge
          variant={
            status === "CONFIRMED"
              ? "default"
              : status === "CANCELLED"
                ? "outline"
                : "secondary"
          }
        >
          {STATUS_LABELS[status] ?? status}
        </Badge>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {status === "PENDING" && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await confirmActionAction(messageId);
                if (result.error) setError(result.error);
              });
            }}
          >
            <Check className="size-4" />
            Bestätigen
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await cancelActionAction(messageId);
                if (result.error) setError(result.error);
              });
            }}
          >
            <X className="size-4" />
            Ablehnen
          </Button>
        </div>
      )}
    </div>
  );
}
