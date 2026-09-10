"use client";

import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5 text-primary" aria-hidden />
          <span>ClassHub</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:px-10">
        <p className="text-sm font-medium text-muted-foreground">Fehler</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Etwas ist schiefgelaufen.
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          Das war unerwartet. Du kannst es noch einmal versuchen — falls es weiter
          passiert, versuch es später erneut.
        </p>
        <Button className="mt-2" onClick={() => retry()}>
          Erneut versuchen
        </Button>
      </main>
    </div>
  );
}
