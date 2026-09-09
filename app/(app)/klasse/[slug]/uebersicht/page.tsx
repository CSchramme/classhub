import { notFound } from "next/navigation";
import { getClassBySlug, getClassMembers, getClassAnnouncements } from "@/lib/classes";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateAnnouncementForm } from "./create-announcement-form";

export default async function ClassOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const klass = await getClassBySlug(slug);
  if (!klass) notFound();

  const [members, announcements, upcomingExams] = await Promise.all([
    getClassMembers(klass.id),
    getClassAnnouncements(klass.id),
    db.exam.findMany({
      where: { classId: klass.id, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mitglieder</CardTitle>
          <CardDescription>{members.length} Mitglied(er)</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kommende Prüfungen</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine anstehenden Prüfungen.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {upcomingExams.map((exam) => (
                <li key={exam.id} className="flex justify-between">
                  <span>{exam.title}</span>
                  <span className="text-muted-foreground">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                      exam.date,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Ankündigungen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Ankündigungen.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {announcements.map((announcement) => (
                <li
                  key={announcement.id}
                  className="border-b border-border pb-3 last:border-0"
                >
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {announcement.author.displayName} ·{" "}
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                      announcement.createdAt,
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <CreateAnnouncementForm classId={klass.id} />
        </CardContent>
      </Card>
    </div>
  );
}
