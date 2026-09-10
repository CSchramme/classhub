import Link from "next/link";
import { listClasses } from "@/lib/admin/classes";
import { listSchoolYears } from "@/lib/admin/school-years";
import { listSchools } from "@/lib/admin/schools";
import { toggleClassArchiveAction } from "./actions";
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
import { CreateClassForm } from "./create-class-form";

export default async function AdminClassesPage() {
  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const classes = await listClasses();
  const schoolYears = await listSchoolYears();
  const schools = await listSchools();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Klassen</h1>
        <p className="text-muted-foreground">Klassen anlegen und verwalten.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neue Klasse</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateClassForm schools={schools} schoolYears={schoolYears} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Klassen</CardTitle>
          <CardDescription>{classes.length} Klasse(n)</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Klassen angelegt.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Schule</TableHead>
                  <TableHead>Schuljahr</TableHead>
                  <TableHead>Mitglieder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((klass) => {
                  const archived = klass.status === "ARCHIVED";
                  return (
                    <TableRow key={klass.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/klassen/${klass.id}`}
                          className="hover:underline"
                        >
                          {klass.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {klass.slug}
                      </TableCell>
                      <TableCell>{klass.school.name}</TableCell>
                      <TableCell>{klass.schoolYear.name}</TableCell>
                      <TableCell>{klass._count.memberships}</TableCell>
                      <TableCell>
                        <Badge variant={archived ? "outline" : "secondary"}>
                          {archived ? "Archiviert" : "Aktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ArchiveToggleForm
                          archived={archived}
                          action={toggleClassArchiveAction.bind(null, klass.id, archived)}
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
