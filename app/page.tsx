import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  "Hausaufgaben",
  "To-Dos",
  "Stundenplan",
  "Termine",
  "Prüfungen",
  "Klassenbereich",
  "Private & Klassen-Cloud",
  "KI-Assistent",
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5 text-primary" aria-hidden />
          <span>ClassHub</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center sm:px-10">
        <Badge variant="secondary">In aktiver Entwicklung</Badge>

        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Alles für deine Schule.
            <br />
            An einem Ort.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            ClassHub bündelt Dashboard, Aufgaben, Stundenplan, Termine, Cloud und einen
            KI-Assistenten in einer modernen, sicheren Plattform.
          </p>
        </div>

        <Separator className="max-w-xs" />

        <ul className="flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {FEATURES.map((feature) => (
            <li key={feature}>
              <Badge variant="outline">{feature}</Badge>
            </li>
          ))}
        </ul>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground sm:px-10">
        © {new Date().getFullYear()} ClassHub
      </footer>
    </div>
  );
}
