import { requireSystemAdminOrRedirect } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import {
  USER_STORAGE_QUOTA_BYTES,
  CLASS_STORAGE_QUOTA_BYTES,
} from "@/lib/storage/constants";
import { formatBytes } from "@/lib/utils";
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

export default async function AdminStoragePage() {
  await requireSystemAdminOrRedirect();

  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const userAgg = await db.user.aggregate({ _sum: { storageUsedBytes: true } });
  const classAgg = await db.class.aggregate({ _sum: { storageUsedBytes: true } });
  const users = await db.user.findMany({
    where: { storageUsedBytes: { gt: 0 } },
    select: { id: true, displayName: true, email: true, storageUsedBytes: true },
    orderBy: { storageUsedBytes: "desc" },
    take: 50,
  });
  const classes = await db.class.findMany({
    where: { storageUsedBytes: { gt: 0 } },
    select: { id: true, name: true, storageUsedBytes: true },
    orderBy: { storageUsedBytes: "desc" },
    take: 50,
  });

  const userTotal = userAgg._sum.storageUsedBytes ?? BigInt(0);
  const classTotal = classAgg._sum.storageUsedBytes ?? BigInt(0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Speicher</h1>
        <p className="text-muted-foreground">
          Cloud-Speichernutzung über alle Nutzer und Klassen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Privat gesamt</CardDescription>
            <CardTitle className="text-2xl">{formatBytes(userTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Klassen gesamt</CardDescription>
            <CardTitle className="text-2xl">{formatBytes(classTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Insgesamt</CardDescription>
            <CardTitle className="text-2xl">
              {formatBytes(userTotal + classTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nutzer mit Speicherverbrauch</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Dateien hochgeladen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead className="text-right">Speicher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-right">
                      {formatBytes(u.storageUsedBytes)} /{" "}
                      {formatBytes(USER_STORAGE_QUOTA_BYTES)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Klassen mit Speicherverbrauch</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Dateien hochgeladen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klasse</TableHead>
                  <TableHead className="text-right">Speicher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">
                      {formatBytes(c.storageUsedBytes)} /{" "}
                      {formatBytes(CLASS_STORAGE_QUOTA_BYTES)}
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
