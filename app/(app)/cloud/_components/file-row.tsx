"use client";

import { useState, useTransition } from "react";
import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { deleteFileAction } from "../actions";

export function FileRow({
  file,
  classId,
  returnPath,
}: {
  file: {
    id: string;
    originalFilename: string;
    sizeBytes: bigint;
    uploadedBy: { displayName: string };
  };
  classId: string | null;
  returnPath: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex flex-col gap-1 border-b border-border py-2 last:border-0">
      <div className="flex items-center gap-3">
        <File className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <a
            href={`/api/cloud/download/${file.id}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {file.originalFilename}
          </a>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.sizeBytes)} · {file.uploadedBy.displayName}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Datei löschen"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await deleteFileAction(file.id, classId, returnPath);
              if (result.error) setError(result.error);
            });
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </li>
  );
}
