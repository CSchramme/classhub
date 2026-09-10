import Link from "next/link";
import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { listNotificationsPage } from "@/lib/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationRow } from "./notification-row";
import { MarkAllReadButton } from "./mark-all-read-button";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUserOrRedirect();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { notifications, total, pageSize } = await listNotificationsPage(user.id, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Benachrichtigungen</h1>
          <p className="text-muted-foreground">{total} insgesamt.</p>
        </div>
        <MarkAllReadButton />
      </div>

      <Card>
        <CardContent className="pt-6">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Benachrichtigungen.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} />
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Seite {page} von {totalPages}
            </span>
            <div className="flex gap-3">
              {page > 1 && (
                <Link
                  href={`/benachrichtigungen?page=${page - 1}`}
                  className="hover:underline"
                >
                  Zurück
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/benachrichtigungen?page=${page + 1}`}
                  className="hover:underline"
                >
                  Weiter
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
