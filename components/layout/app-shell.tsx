import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import type { SessionUser } from "@/lib/auth/session";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const isSystemAdmin = user.role === "SYSTEM_ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar isSystemAdmin={isSystemAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav isSystemAdmin={isSystemAdmin} />
    </div>
  );
}
