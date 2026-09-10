"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** Plain fetch() to the Route Handler, not a Server Action — binary file
 * bodies don't fit the useActionState/FormData convention used elsewhere
 * cleanly, and the upload needs a real multipart POST (see
 * app/api/cloud/upload/route.ts). */
export function UploadForm({
  classId,
  folderId,
}: {
  classId: string | null;
  folderId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const selected = fileInput.files?.[0];
    if (!selected) {
      setError("Bitte wähle eine Datei aus.");
      return;
    }

    const body = new FormData();
    body.set("file", selected);
    if (classId) body.set("classId", classId);
    if (folderId) body.set("folderId", folderId);

    setError(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/cloud/upload", { method: "POST", body });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Upload fehlgeschlagen.");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError("Upload fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Input type="file" name="file" required disabled={isPending} />
        <Button type="submit" disabled={isPending} variant="outline">
          <Upload className="size-4" />
          {isPending ? "Lädt hoch…" : "Hochladen"}
        </Button>
      </div>
    </form>
  );
}
