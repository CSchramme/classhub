import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/authorization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ "password-changed"?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect("/home");
  }
  const { "password-changed": passwordChanged } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>Willkommen zurück bei ClassHub.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {passwordChanged && (
          <Alert>
            <AlertDescription>
              Dein Passwort wurde geändert. Bitte melde dich erneut an.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
