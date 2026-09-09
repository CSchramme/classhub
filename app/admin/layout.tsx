import { requireSystemAdminOrRedirect } from "@/lib/auth/authorization";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSystemAdminOrRedirect();
  return <AppShell user={user}>{children}</AppShell>;
}
