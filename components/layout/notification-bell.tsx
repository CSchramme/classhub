"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/notifications/actions";
import { cn } from "@/lib/utils";

const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(
    date,
  );

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationBell({
  unreadCount,
  notifications,
}: {
  unreadCount: number;
  notifications: NotificationItem[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Benachrichtigungen öffnen"
            className="relative"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            Benachrichtigungen
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {unreadCount > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => {
                startTransition(() => {
                  markAllNotificationsReadAction();
                });
              }}
            >
              Alle als gelesen markieren
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Keine Benachrichtigungen.
          </p>
        ) : (
          <DropdownMenuGroup>
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                render={<Link href={n.link ?? "/benachrichtigungen"} />}
                className={cn(
                  "flex flex-col items-start gap-0.5 whitespace-normal",
                  !n.readAt && "bg-accent/50",
                )}
                onClick={() => {
                  if (!n.readAt) {
                    startTransition(() => {
                      markNotificationReadAction(n.id);
                    });
                  }
                }}
              >
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtDateTime(n.createdAt)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/benachrichtigungen" />}>
            Alle anzeigen
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
