import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/logout-action";
import { listNotifications, getUnreadCount } from "@/lib/notifications";
import type { SessionUser } from "@/lib/auth/session";

function initials(user: SessionUser) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
}

export async function Topbar({ user }: { user: SessionUser }) {
  // Sequential — concurrent queries are unreliable against the local dev
  // database (see lib/storage/index.ts for the first occurrence of this).
  const notifications = await listNotifications(user.id, 8);
  const unreadCount = await getUnreadCount(user.id);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
      <div className="font-semibold md:hidden">ClassHub</div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2">
        <NotificationBell unreadCount={unreadCount} notifications={notifications} />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Kontomenü öffnen" />}
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials(user)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.displayName}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/profil" />}>
                <UserRound className="size-4" aria-hidden />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/einstellungen" />}>
                <Settings className="size-4" aria-hidden />
                Einstellungen
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <form action={logoutAction}>
                <DropdownMenuItem render={<button type="submit" className="w-full" />}>
                  <LogOut className="size-4" aria-hidden />
                  Abmelden
                </DropdownMenuItem>
              </form>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
