import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5 text-primary" aria-hidden />
          <span>ClassHub</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:px-10">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Diese Seite gibt es nicht.
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          Der Link ist entweder falsch oder die Seite wurde entfernt.
        </p>
        <Button className="mt-2" nativeButton={false} render={<Link href="/home" />}>
          Zurück zum Start
        </Button>
      </main>
    </div>
  );
}
