import Link from "next/link";
import { requireSystemAdminOrRedirect } from "@/lib/auth/authorization";
import { listAuditLogs } from "@/lib/audit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AuditAction } from "@/generated/prisma/client";

const ACTION_LABELS: Record<AuditAction, string> = {
  USER_CREATED: "Benutzer erstellt",
  USER_DISABLED: "Benutzer deaktiviert",
  USER_ENABLED: "Benutzer aktiviert",
  USER_ASSIGNED_TO_CLASS: "Klasse zugewiesen",
  USER_REMOVED_FROM_CLASS: "Aus Klasse entfernt",
  AI_ACCESS_GRANTED: "KI-Zugriff gewährt",
  AI_ACCESS_REVOKED: "KI-Zugriff entzogen",
  PASSWORD_RESET_REQUESTED: "Passwort-Reset angefordert",
  PASSWORD_CHANGE_REQUIRED: "Passwortwechsel erzwungen",
  FILE_UPLOADED: "Datei hochgeladen",
  FILE_DELETED: "Datei gelöscht",
  AI_REQUEST: "KI-Anfrage",
};

const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );

function isAuditAction(value: string): value is AuditAction {
  return value in ACTION_LABELS;
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requireSystemAdminOrRedirect();
  const { action: actionParam, page: pageParam } = await searchParams;
  const action = actionParam && isAuditAction(actionParam) ? actionParam : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

  const { logs, total, pageSize } = await listAuditLogs({ action, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Protokoll</h1>
        <p className="text-muted-foreground">{total} Ereignisse insgesamt.</p>
      </div>

      <form className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="action" className="text-sm font-medium">
            Aktion
          </label>
          <select
            id="action"
            name="action"
            defaultValue={action ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Alle</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-8 rounded-lg border border-input px-3 text-sm hover:bg-accent"
        >
          Filtern
        </button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ereignisse</CardTitle>
          <CardDescription>
            Seite {page} von {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Einträge.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Aktion</TableHead>
                  <TableHead>Von</TableHead>
                  <TableHead>Betrifft</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {fmtDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ACTION_LABELS[log.action]}</Badge>
                    </TableCell>
                    <TableCell>{log.actor?.displayName ?? "System"}</TableCell>
                    <TableCell>{log.target?.displayName ?? "–"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Seite {page} von {totalPages}
            </span>
            <div className="flex gap-3">
              {page > 1 && (
                <Link
                  href={`/admin/logs?${new URLSearchParams({
                    ...(action ? { action } : {}),
                    page: String(page - 1),
                  })}`}
                  className="hover:underline"
                >
                  Zurück
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/logs?${new URLSearchParams({
                    ...(action ? { action } : {}),
                    page: String(page + 1),
                  })}`}
                  className="hover:underline"
                >
                  Weiter
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
