import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { getUserClassMemberships } from "@/lib/classes";
import { db } from "@/lib/db";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function KlassePage() {
  const user = await requireUserOrRedirect();
  const memberships = await getUserClassMemberships(user.id);

  if (memberships.length > 0) {
    redirect(`/klasse/${memberships[0].class.slug}/uebersicht`);
  }

  if (user.role === "SYSTEM_ADMIN") {
    const classes = await db.class.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, school: { select: { name: true } } },
    });
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Klasse</h1>
          <p className="text-muted-foreground">
            Du bist keiner Klasse zugewiesen. Als Systemadministrator kannst du dir alle
            Klassen ansehen:
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((klass) => (
            <Link key={klass.id} href={`/klasse/${klass.slug}/uebersicht`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{klass.name}</CardTitle>
                  <CardDescription>{klass.school.name}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold">Keine Klasse</h1>
      <p className="text-muted-foreground">Dir wurde noch keine Klasse zugewiesen.</p>
    </div>
  );
}
