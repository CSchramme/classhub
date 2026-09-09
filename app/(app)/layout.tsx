import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUserOrRedirect();
  return <AppShell user={user}>{children}</AppShell>;
}
