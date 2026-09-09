import { listSchools } from "@/lib/admin/schools";
import { toggleSchoolArchiveAction } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArchiveToggleForm } from "@/components/admin/archive-toggle-form";
import { CreateSchoolForm } from "./create-school-form";

export default async function AdminSchoolsPage() {
  const schools = await listSchools();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schulen</h1>
        <p className="text-muted-foreground">Schulen anlegen und verwalten.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neue Schule</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateSchoolForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Schulen</CardTitle>
          <CardDescription>{schools.length} Schule(n)</CardDescription>
        </CardHeader>
        <CardContent>
          {schools.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Schulen angelegt.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Klassen</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => {
                  const archived = school.status === "ARCHIVED";
                  return (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school._count.classes}</TableCell>
                      <TableCell>{school._count.users}</TableCell>
                      <TableCell>
                        <Badge variant={archived ? "outline" : "secondary"}>
                          {archived ? "Archiviert" : "Aktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ArchiveToggleForm
                          archived={archived}
                          action={toggleSchoolArchiveAction.bind(
                            null,
                            school.id,
                            archived,
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
