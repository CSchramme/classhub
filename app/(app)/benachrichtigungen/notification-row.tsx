"use client";

import Link from "next/link";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { markNotificationReadAction } from "@/lib/notifications/actions";

const fmtDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationRow({ notification }: { notification: Notification }) {
  const [, startTransition] = useTransition();

  const content = (
    <div
      className={cn(
        "flex flex-col gap-0.5 border-b border-border py-3 last:border-0",
        !notification.readAt && "font-medium",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{notification.title}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {fmtDateTime(notification.createdAt)}
        </span>
      </div>
      <span className="text-sm font-normal text-muted-foreground">
        {notification.body}
      </span>
    </div>
  );

  if (!notification.link) {
    return <li>{content}</li>;
  }

  return (
    <li>
      <Link
        href={notification.link}
        className="block rounded-lg px-2 hover:bg-accent/50"
        onClick={() => {
          if (!notification.readAt) {
            startTransition(() => {
              markNotificationReadAction(notification.id);
            });
          }
        }}
      >
        {content}
      </Link>
    </li>
  );
}
