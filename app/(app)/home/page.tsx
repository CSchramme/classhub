import Link from "next/link";
import { ClipboardList, CheckSquare, CalendarDays, GraduationCap } from "lucide-react";
import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { getUserClassMemberships } from "@/lib/classes";
import { getDashboardData } from "@/lib/features/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fmtTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);

const QUICK_ACTIONS = [
  { label: "Hausaufgabe", href: "/home/hausaufgaben", icon: ClipboardList },
  { label: "To-Do", href: "/home/todos", icon: CheckSquare },
  { label: "Termin", href: "/home/termine", icon: CalendarDays },
  { label: "Prüfung", href: "/home/pruefungen", icon: GraduationCap },
];

export default async function HomePage() {
  const user = await requireUserOrRedirect();
  const memberships = await getUserClassMemberships(user.id);
  const classIds = memberships.map((m) => m.class.id);
  const {
    todayTimetable,
    openHomework,
    openTodos,
    nextExam,
    todayEvents,
    upcomingEvents,
  } = await getDashboardData(user.id, classIds, user.schoolId);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo, {user.firstName}!
        </h1>
        <p className="text-muted-foreground">
          {memberships.length > 0
            ? `Klasse ${memberships.map((m) => m.class.name).join(", ")}`
            : "Willkommen zurück bei ClassHub."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.href}
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={action.href} />}
            >
              <Icon className="size-4" />+ {action.label}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heute</CardTitle>
          </CardHeader>
          <CardContent>
            {todayTimetable.length === 0 && todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nichts Geplantes für heute.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {todayTimetable.map((entry) => (
                  <li key={entry.id} className="flex justify-between">
                    <span>{entry.subject.name}</span>
                    <span className="text-muted-foreground">
                      {fmtTime(entry.startTime)} – {fmtTime(entry.endTime)}
                    </span>
                  </li>
                ))}
                {todayEvents.map((event) => (
                  <li key={event.id} className="flex justify-between">
                    <span>{event.title}</span>
                    <span className="text-muted-foreground">
                      {fmtTime(event.startsAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nächste Prüfung</CardTitle>
          </CardHeader>
          <CardContent>
            {!nextExam ? (
              <p className="text-sm text-muted-foreground">
                Keine anstehenden Prüfungen.
              </p>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{nextExam.title}</p>
                  {nextExam.subject && (
                    <p className="text-muted-foreground">{nextExam.subject.name}</p>
                  )}
                </div>
                <Badge variant="outline">{fmtDateTime(nextExam.date)}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offene Hausaufgaben</CardTitle>
          </CardHeader>
          <CardContent>
            {openHomework.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Du hast aktuell keine offenen Hausaufgaben. 🎉
              </p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {openHomework.map((hw) => (
                  <li key={hw.id} className="flex justify-between">
                    <span>{hw.title}</span>
                    <span className="text-muted-foreground">{fmtDate(hw.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offene To-Dos</CardTitle>
          </CardHeader>
          <CardContent>
            {openTodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine offenen To-Dos.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {openTodos.map((todo) => (
                  <li key={todo.id} className="flex justify-between">
                    <span>{todo.title}</span>
                    {todo.dueDate && (
                      <span className="text-muted-foreground">
                        {fmtDate(todo.dueDate)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Kommende Termine</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine kommenden Termine.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="flex justify-between">
                    <span>{event.title}</span>
                    <span className="text-muted-foreground">
                      {fmtDateTime(event.startsAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
