import Link from "next/link";
import { Users, School, CalendarRange, ShieldCheck, HardDrive } from "lucide-react";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatBytes(bytes: bigint) {
  const mb = Number(bytes) / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default async function AdminDashboardPage() {
  const [userCount, schoolCount, classCount, storageAgg, recentAudit] = await Promise.all(
    [
      db.user.count(),
      db.school.count(),
      db.class.count(),
      db.user.aggregate({ _sum: { storageUsedBytes: true } }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          actor: { select: { displayName: true } },
          target: { select: { displayName: true } },
        },
      }),
    ],
  );

  const cards = [
    { label: "Benutzer", value: userCount, icon: Users, href: "/admin/benutzer" },
    { label: "Schulen", value: schoolCount, icon: School, href: "/admin/schulen" },
    { label: "Klassen", value: classCount, icon: CalendarRange, href: "/admin/klassen" },
    {
      label: "Speicher (privat)",
      value: formatBytes(storageAgg._sum.storageUsedBytes ?? BigInt(0)),
      icon: HardDrive,
      href: "/admin/speicher",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck className="size-6 text-primary" aria-hidden />
          Administration
        </h1>
        <p className="text-muted-foreground">Überblick über ClassHub.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-1 pt-6">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <span className="text-2xl font-semibold">{card.value}</span>
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base">Letzte Audit-Events</CardTitle>
            <CardDescription>Die letzten 10 protokollierten Ereignisse.</CardDescription>
          </div>
          <Link href="/admin/logs" className="text-sm text-primary hover:underline">
            Alle anzeigen
          </Link>
        </CardHeader>
        <CardContent>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Ereignisse protokolliert.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {recentAudit.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {entry.action}
                  </span>
                  <span className="text-muted-foreground">
                    {entry.target?.displayName ?? entry.actor?.displayName ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("de-DE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
