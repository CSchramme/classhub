import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { listExamsForUser } from "@/lib/features/exams";
import { listSubjectsForSchool } from "@/lib/features/subjects";
import { getUserClassMemberships } from "@/lib/classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateExamForm } from "./create-exam-form";
import { ExamItem } from "./exam-item";

export default async function PruefungenPage() {
  const user = await requireUserOrRedirect();
  const memberships = await getUserClassMemberships(user.id);
  const classIds = memberships.map((m) => m.class.id);

  const [exams, subjects] = await Promise.all([
    listExamsForUser(classIds),
    user.schoolId ? listSubjectsForSchool(user.schoolId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prüfungen</h1>
        <p className="text-muted-foreground">Prüfungen deiner Klasse.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neue Prüfung</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateExamForm classes={memberships.map((m) => m.class)} subjects={subjects} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Prüfungen</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine anstehenden Prüfungen.</p>
          ) : (
            <ul>
              {exams.map((exam) => (
                <ExamItem key={exam.id} exam={exam} currentUserId={user.id} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
