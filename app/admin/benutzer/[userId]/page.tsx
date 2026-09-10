import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSystemAdminOrRedirect } from "@/lib/auth/authorization";
import { getUserDetail } from "@/lib/admin/users";
import { USER_STATUS_LABELS, AUDIT_ACTION_LABELS } from "@/lib/labels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { UserRowActions } from "../user-row-actions";

const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireSystemAdminOrRedirect();
  const { userId } = await params;
  const detail = await getUserDetail(userId);
  if (!detail) notFound();

  const { user, auditLog } = detail;
  const disabled = user.status === "DISABLED";
  const aiAccess = user.permissions.some((p) => p.key === "AI_ACCESS");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <Link
          href="/admin/benutzer"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Alle Benutzer
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{user.displayName}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base">Profil</CardTitle>
          </div>
          <UserRowActions userId={user.id} disabled={disabled} aiAccess={aiAccess} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={user.role === "SYSTEM_ADMIN" ? "default" : "outline"}>
              {user.role === "SYSTEM_ADMIN" ? "Admin" : "Schüler:in"}
            </Badge>
            <Badge variant={disabled ? "outline" : "secondary"}>
              {USER_STATUS_LABELS[user.status]}
            </Badge>
            {aiAccess && <Badge variant="secondary">KI-Zugriff</Badge>}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Vor-/Nachname</dt>
            <dd>
              {user.firstName} {user.lastName}
            </dd>
            <dt className="text-muted-foreground">Schule</dt>
            <dd>{user.school?.name ?? "–"}</dd>
            <dt className="text-muted-foreground">Erstellt am</dt>
            <dd>{fmtDate(user.createdAt)}</dd>
            <dt className="text-muted-foreground">Erstellt von</dt>
            <dd>{user.createdBy?.displayName ?? "–"}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Klassen</CardTitle>
          <CardDescription>Aktuelle und frühere Mitgliedschaften.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.classMemberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Klassenmitgliedschaften.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {user.classMemberships.map((m, i) => (
                <li
                  key={`${m.class.id}-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{m.class.name}</span>
                  <span className="text-muted-foreground">
                    {m.leftAt
                      ? `${fmtDate(m.joinedAt)} – ${fmtDate(m.leftAt)}`
                      : `Seit ${fmtDate(m.joinedAt)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Protokoll</CardTitle>
          <CardDescription>Letzte Ereignisse als Auslöser oder Ziel.</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Einträge.</p>
          ) : (
            <Table>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {fmtDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{AUDIT_ACTION_LABELS[entry.action]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.actorUserId === userId
                        ? `→ ${entry.target?.displayName ?? "–"}`
                        : `von ${entry.actor?.displayName ?? "System"}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
