import { requireSystemAdminOrRedirect } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleAiForm } from "./toggle-ai-form";

export default async function AdminAiPage() {
  await requireSystemAdminOrRedirect();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const settings = await db.systemSettings.findUnique({ where: { id: "singleton" } });
  const usageAgg = await db.aIUsageLog.aggregate({
    where: { createdAt: { gte: startOfMonth } },
    _sum: { estimatedCostEur: true },
    _count: true,
  });
  const usersWithAccess = await db.userPermission.count({ where: { key: "AI_ACCESS" } });

  const enabled = settings?.aiGloballyEnabled ?? false;
  const costThisMonth = usageAgg._sum.estimatedCostEur?.toNumber() ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">KI-Einstellungen</h1>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">KI-Funktion</CardTitle>
          <CardDescription>
            {enabled
              ? "Aktuell für berechtigte Nutzer aktiviert."
              : "Aktuell für alle Nutzer deaktiviert."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleAiForm enabled={enabled} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Nutzer mit Zugriff</CardDescription>
            <CardTitle className="text-2xl">{usersWithAccess}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Anfragen diesen Monat</CardDescription>
            <CardTitle className="text-2xl">{usageAgg._count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Geschätzte Kosten diesen Monat</CardDescription>
            <CardTitle className="text-2xl">{costThisMonth.toFixed(2)} €</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
