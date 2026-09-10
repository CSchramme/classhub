import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { listTimetableForClass } from "@/lib/features/timetable";
import { listSubjectsForSchool } from "@/lib/features/subjects";
import { getUserClassMemberships } from "@/lib/classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTimetableEntryForm } from "./create-entry-form";
import { TimetableEntryRow } from "./timetable-entry-row";

const DAYS: { key: string; label: string }[] = [
  { key: "MONDAY", label: "Montag" },
  { key: "TUESDAY", label: "Dienstag" },
  { key: "WEDNESDAY", label: "Mittwoch" },
  { key: "THURSDAY", label: "Donnerstag" },
  { key: "FRIDAY", label: "Freitag" },
];

export default async function StundenplanPage() {
  const user = await requireUserOrRedirect();
  const memberships = await getUserClassMemberships(user.id);

  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-xl font-semibold">Kein Stundenplan</h1>
        <p className="text-muted-foreground">Dir wurde noch keine Klasse zugewiesen.</p>
      </div>
    );
  }

  const klass = memberships[0].class;
  const [entries, subjects] = await Promise.all([
    listTimetableForClass(klass.id),
    user.schoolId ? listSubjectsForSchool(user.schoolId) : Promise.resolve([]),
  ]);

  const entriesByDay = new Map(
    DAYS.map((day) => [day.key, entries.filter((e) => e.dayOfWeek === day.key)]),
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stundenplan</h1>
        <p className="text-muted-foreground">Klasse {klass.name}</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neue Stunde</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTimetableEntryForm classId={klass.id} subjects={subjects} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => (
          <Card key={day.key}>
            <CardHeader>
              <CardTitle className="text-base">{day.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {entriesByDay.get(day.key)!.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Stunden.</p>
              ) : (
                <ul>
                  {entriesByDay.get(day.key)!.map((entry) => (
                    <TimetableEntryRow key={entry.id} entry={entry} classId={klass.id} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
