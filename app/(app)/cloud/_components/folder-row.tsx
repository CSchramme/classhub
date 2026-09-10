"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteFolderAction } from "../actions";

export function FolderRow({
  folder,
  basePath,
  classId,
  returnPath,
}: {
  folder: { id: string; name: string };
  basePath: string;
  classId: string | null;
  returnPath: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex flex-col gap-1 border-b border-border py-2 last:border-0">
      <div className="flex items-center gap-3">
        <Folder className="size-4 shrink-0 text-muted-foreground" />
        <Link
          href={`${basePath}?folder=${folder.id}`}
          className="flex-1 text-sm font-medium hover:underline"
        >
          {folder.name}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ordner löschen"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await deleteFolderAction(folder.id, classId, returnPath);
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
