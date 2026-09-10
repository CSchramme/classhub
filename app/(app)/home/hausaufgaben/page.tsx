import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { listHomeworkForUser } from "@/lib/features/homework";
import { listSubjectsForSchool } from "@/lib/features/subjects";
import { getUserClassMemberships } from "@/lib/classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateHomeworkForm } from "./create-homework-form";
import { HomeworkItem } from "./homework-item";

export default async function HausaufgabenPage() {
  const user = await requireUserOrRedirect();
  const memberships = await getUserClassMemberships(user.id);
  const classIds = memberships.map((m) => m.class.id);

  const [homeworks, subjects] = await Promise.all([
    listHomeworkForUser(user.id, classIds),
    user.schoolId ? listSubjectsForSchool(user.schoolId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hausaufgaben</h1>
        <p className="text-muted-foreground">Deine Hausaufgaben und die deiner Klasse.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neue Hausaufgabe</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateHomeworkForm
            subjects={subjects}
            classes={memberships.map((m) => m.class)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Hausaufgaben</CardTitle>
        </CardHeader>
        <CardContent>
          {homeworks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Du hast aktuell keine offenen Hausaufgaben. 🎉
            </p>
          ) : (
            <ul>
              {homeworks.map((homework) => (
                <HomeworkItem
                  key={homework.id}
                  homework={homework}
                  currentUserId={user.id}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
