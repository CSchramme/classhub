"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEM, BOTTOM_NAV_ITEMS, SIDEBAR_ITEMS } from "@/lib/nav-items";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function isActive(pathname: string, href: string) {
  return href === "/home" ? pathname === "/home" : pathname.startsWith(href);
}

export function BottomNav({ isSystemAdmin }: { isSystemAdmin: boolean }) {
  const pathname = usePathname();
  const moreItems = isSystemAdmin ? [...SIDEBAR_ITEMS, ADMIN_NAV_ITEM] : SIDEBAR_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur md:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground"
            />
          }
        >
          <Menu className="size-5" aria-hidden />
          Mehr
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Alle Bereiche</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
