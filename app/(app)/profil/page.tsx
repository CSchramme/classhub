import Link from "next/link";
import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { getProfileMemberships, getSchoolName } from "@/lib/features/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  PENDING_SETUP: "Einrichtung ausstehend",
  DISABLED: "Deaktiviert",
  PASSWORD_CHANGE_REQUIRED: "Passwortwechsel nötig",
};

const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);

export default async function ProfilePage() {
  const user = await requireUserOrRedirect();
  // Sequential — see lib/storage/index.ts for why this dev database doesn't
  // tolerate concurrent queries well.
  const memberships = await getProfileMemberships(user.id);
  const schoolName = user.schoolId ? await getSchoolName(user.schoolId) : null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
      </div>

      <Card className="max-w-lg">
        <CardContent className="flex items-start gap-4 pt-6">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant={user.role === "SYSTEM_ADMIN" ? "default" : "outline"}>
                {user.role === "SYSTEM_ADMIN" ? "Admin" : "Schüler:in"}
              </Badge>
              <Badge variant="secondary">{STATUS_LABELS[user.status]}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Schule</CardTitle>
        </CardHeader>
        <CardContent>
          {schoolName ? (
            <p className="text-sm">{schoolName}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Keiner Schule zugeordnet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Klassen</CardTitle>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Du bist aktuell in keiner Klasse.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {memberships.map((m) => (
                <li
                  key={m.class.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{m.class.name}</span>
                  <span className="text-muted-foreground">
                    Seit {fmtDate(m.joinedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="max-w-lg self-start"
        nativeButton={false}
        render={<Link href="/einstellungen/konto" />}
      >
        Zu den Einstellungen
      </Button>
    </div>
  );
}
