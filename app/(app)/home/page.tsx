import { requireUserOrRedirect } from "@/lib/auth/authorization";

export default async function HomePage() {
  const user = await requireUserOrRedirect();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo, {user.firstName}!
        </h1>
        <p className="text-muted-foreground">Willkommen zurück bei ClassHub.</p>
      </div>
    </div>
  );
}
