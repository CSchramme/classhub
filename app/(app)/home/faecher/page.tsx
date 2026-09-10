import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { listSubjectsForSchool } from "@/lib/features/subjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateSubjectForm } from "./create-subject-form";

export default async function SubjectsPage() {
  const user = await requireUserOrRedirect();
  const subjects = user.schoolId ? await listSubjectsForSchool(user.schoolId) : [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fächer</h1>
        <p className="text-muted-foreground">Fächer deiner Schule.</p>
      </div>

      {!user.schoolId ? (
        <p className="text-sm text-muted-foreground">
          Dir ist keine Schule zugewiesen. Bitte wende dich an einen Administrator.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alle Fächer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Fächer angelegt.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Badge key={subject.id} variant="outline">
                    {subject.name}
                  </Badge>
                ))}
              </div>
            )}
            <CreateSubjectForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
