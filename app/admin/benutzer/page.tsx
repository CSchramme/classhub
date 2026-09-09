import { listUsers } from "@/lib/admin/users";
import { listSchools } from "@/lib/admin/schools";
import { listClasses } from "@/lib/admin/classes";
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
import { CreateUserForm } from "./create-user-form";
import { UserRowActions } from "./user-row-actions";
import { AssignClassForm } from "./assign-class-form";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  PENDING_SETUP: "Einrichtung ausstehend",
  DISABLED: "Deaktiviert",
  PASSWORD_CHANGE_REQUIRED: "Passwortwechsel nötig",
};

export default async function AdminUsersPage() {
  const [users, schools, classes] = await Promise.all([
    listUsers(),
    listSchools(),
    listClasses(),
  ]);

  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, school: c.school }));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Benutzer</h1>
        <p className="text-muted-foreground">Benutzer erstellen und verwalten.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Neuer Benutzer</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm schools={schools} classes={classOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Benutzer</CardTitle>
          <CardDescription>{users.length} Benutzer</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Benutzer angelegt.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Klasse</TableHead>
                  <TableHead>KI</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const disabled = user.status === "DISABLED";
                  const aiAccess = user.permissions.some((p) => p.key === "AI_ACCESS");
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === "SYSTEM_ADMIN" ? "default" : "outline"}
                        >
                          {user.role === "SYSTEM_ADMIN" ? "Admin" : "Schüler:in"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={disabled ? "outline" : "secondary"}>
                          {STATUS_LABELS[user.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {user.classMemberships.map((m) => (
                            <span key={m.class.id} className="text-sm">
                              {m.class.name}
                            </span>
                          ))}
                          <AssignClassForm userId={user.id} classes={classOptions} />
                        </div>
                      </TableCell>
                      <TableCell>{aiAccess ? "Ja" : "Nein"}</TableCell>
                      <TableCell className="text-right">
                        <UserRowActions
                          userId={user.id}
                          disabled={disabled}
                          aiAccess={aiAccess}
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
