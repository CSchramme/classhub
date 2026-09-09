import { notFound } from "next/navigation";
import { getClassBySlug, getClassMembers } from "@/lib/classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClassMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const klass = await getClassBySlug(slug);
  if (!klass) notFound();

  const members = await getClassMembers(klass.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mitglieder</CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Mitglieder.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Dabei seit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((membership) => (
                <TableRow key={membership.user.id}>
                  <TableCell className="font-medium">
                    {membership.user.displayName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        membership.user.role === "SYSTEM_ADMIN" ? "default" : "outline"
                      }
                    >
                      {membership.user.role === "SYSTEM_ADMIN" ? "Admin" : "Schüler:in"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                      membership.joinedAt,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
