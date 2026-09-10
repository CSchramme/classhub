import Link from "next/link";
import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { getUserClassMemberships } from "@/lib/classes";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClassCloudIndexPage() {
  const user = await requireUserOrRedirect();
  const memberships = await getUserClassMemberships(user.id);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Klassen-Cloud</h1>
        <p className="text-muted-foreground">
          Für alle Mitglieder deiner Klasse sichtbar.
        </p>
      </div>

      {memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">Du bist aktuell in keiner Klasse.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <Link key={m.class.id} href={`/cloud/klasse/${m.class.slug}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle className="text-base">{m.class.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
