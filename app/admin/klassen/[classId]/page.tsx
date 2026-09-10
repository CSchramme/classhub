import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSystemAdminOrRedirect } from "@/lib/auth/authorization";
import { getClassDetail } from "@/lib/admin/classes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RemoveMemberButton } from "./remove-member-button";

const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  await requireSystemAdminOrRedirect();
  const { classId } = await params;
  const detail = await getClassDetail(classId);
  if (!detail) notFound();

  const { class: klass, memberships, homeworkCount, examCount } = detail;
  const activeMembers = memberships.filter((m) => !m.leftAt);
  const pastMembers = memberships.filter((m) => m.leftAt);
  const archived = klass.status === "ARCHIVED";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <Link
          href="/admin/klassen"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Alle Klassen
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{klass.name}</h1>
        <p className="text-muted-foreground">
          {klass.school.name} · {klass.schoolYear.name}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={archived ? "outline" : "secondary"}>
              {archived ? "Archiviert" : "Aktiv"}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Slug</dt>
            <dd>{klass.slug}</dd>
            <dt className="text-muted-foreground">Aktive Mitglieder</dt>
            <dd>{activeMembers.length}</dd>
            <dt className="text-muted-foreground">Hausaufgaben</dt>
            <dd>{homeworkCount}</dd>
            <dt className="text-muted-foreground">Prüfungen</dt>
            <dd>{examCount}</dd>
          </dl>
          <Link
            href={`/klasse/${klass.slug}/uebersicht`}
            className="text-sm text-primary hover:underline"
          >
            Klassenbereich öffnen
          </Link>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Mitglieder</CardTitle>
          <CardDescription>{activeMembers.length} aktiv</CardDescription>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine aktiven Mitglieder.</p>
          ) : (
            <ul className="flex flex-col">
              {activeMembers.map((m) => (
                <li
                  key={m.user.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                >
                  <div>
                    <Link
                      href={`/admin/benutzer/${m.user.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {m.user.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Seit {fmtDate(m.joinedAt)}
                    </p>
                  </div>
                  <RemoveMemberButton userId={m.user.id} classId={klass.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {pastMembers.length > 0 && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Frühere Mitglieder</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {pastMembers.map((m, i) => (
                <li key={`${m.user.id}-${i}`} className="flex justify-between text-sm">
                  <span>{m.user.displayName}</span>
                  <span className="text-muted-foreground">
                    {fmtDate(m.joinedAt)} – {fmtDate(m.leftAt!)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
