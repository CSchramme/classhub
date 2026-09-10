import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TABS = [
  { label: "Konto", segment: "konto" },
  { label: "Sicherheit", segment: "sicherheit" },
];

/**
 * Lives outside app/(app)/ deliberately: that group's layout calls
 * requireUserOrRedirect(), which sends a PASSWORD_CHANGE_REQUIRED user to
 * /einstellungen/sicherheit — nesting this route under it would redirect
 * that same page back to itself, making it unreachable. This layout uses
 * the weaker requireAuthenticatedUser() instead so the forced-change flow
 * actually has somewhere to land, and rebuilds the same AppShell for
 * visual consistency with the rest of the app.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell user={user}>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
        </div>

        {user.status === "PASSWORD_CHANGE_REQUIRED" && (
          <Alert variant="destructive">
            <AlertDescription>
              Du musst dein Passwort ändern, bevor du ClassHub weiter nutzen kannst.
            </AlertDescription>
          </Alert>
        )}

        <nav className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <Link
              key={tab.segment}
              href={`/einstellungen/${tab.segment}`}
              className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </AppShell>
  );
}
