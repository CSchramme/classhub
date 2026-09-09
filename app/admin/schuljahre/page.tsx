import { listSchoolYears } from "@/lib/admin/school-years";
import { listSchools } from "@/lib/admin/schools";
import { toggleSchoolYearArchiveAction } from "./actions";
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
import { CreateSchoolYearForm } from "./create-school-year-form";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE").format(date);
}

export default async function AdminSchoolYearsPage() {
  const [schoolYears, schools] = await Promise.all([listSchoolYears(), listSchools()]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schuljahre</h1>
        <p className="text-muted-foreground">
          Schuljahre pro Schule anlegen und verwalten.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neues Schuljahr</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateSchoolYearForm schools={schools} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Schuljahre</CardTitle>
          <CardDescription>{schoolYears.length} Schuljahr(e)</CardDescription>
        </CardHeader>
        <CardContent>
          {schoolYears.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Schuljahre angelegt.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schule</TableHead>
                  <TableHead>Bezeichnung</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Klassen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schoolYears.map((year) => {
                  const archived = year.status === "ARCHIVED";
                  return (
                    <TableRow key={year.id}>
                      <TableCell>{year.school.name}</TableCell>
                      <TableCell className="font-medium">{year.name}</TableCell>
                      <TableCell>
                        {formatDate(year.startDate)} – {formatDate(year.endDate)}
                      </TableCell>
                      <TableCell>{year._count.classes}</TableCell>
                      <TableCell>
                        <Badge variant={archived ? "outline" : "secondary"}>
                          {archived ? "Archiviert" : "Aktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ArchiveToggleForm
                          archived={archived}
                          action={toggleSchoolYearArchiveAction.bind(
                            null,
                            year.id,
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
