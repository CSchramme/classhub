"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEM, SIDEBAR_ITEMS } from "@/lib/nav-items";

function isActive(pathname: string, href: string) {
  return href === "/home" ? pathname === "/home" : pathname.startsWith(href);
}

export function Sidebar({ isSystemAdmin }: { isSystemAdmin: boolean }) {
  const pathname = usePathname();
  const items = isSystemAdmin ? [...SIDEBAR_ITEMS, ADMIN_NAV_ITEM] : SIDEBAR_ITEMS;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-5 py-4 font-semibold">
        <GraduationCap className="size-5 text-primary" aria-hidden />
        <span>ClassHub</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
