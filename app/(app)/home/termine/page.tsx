import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { listEventsForUser } from "@/lib/features/events";
import { listSchools } from "@/lib/admin/schools";
import { getUserClassMemberships } from "@/lib/classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateEventForm } from "./create-event-form";
import { EventItem } from "./event-item";

export default async function TerminePage() {
  const user = await requireUserOrRedirect();
  const isSystemAdmin = user.role === "SYSTEM_ADMIN";
  const memberships = await getUserClassMemberships(user.id);
  const classIds = memberships.map((m) => m.class.id);

  const [events, schools] = await Promise.all([
    listEventsForUser(user.id, classIds, user.schoolId),
    isSystemAdmin ? listSchools() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Termine</h1>
        <p className="text-muted-foreground">Persönliche, Klassen- und Schultermine.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neuer Termin</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEventForm
            classes={memberships.map((m) => m.class)}
            schools={schools}
            isSystemAdmin={isSystemAdmin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Termine</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine anstehenden Termine.</p>
          ) : (
            <ul>
              {events.map((event) => (
                <EventItem key={event.id} event={event} currentUserId={user.id} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
