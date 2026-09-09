import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/authorization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect("/home");
  }

  const existingUserCount = await db.user.count();
  const registrationOpen = existingUserCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ClassHub einrichten</CardTitle>
        <CardDescription>
          {registrationOpen
            ? "Richte den ersten Systemadministrator ein. Danach ist die öffentliche Registrierung geschlossen."
            : "Die Registrierung ist geschlossen."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registrationOpen ? (
          <RegisterForm />
        ) : (
          <p className="text-sm text-muted-foreground">
            ClassHub ist bereits eingerichtet. Bitte wende dich an deine Schule, um einen
            Zugang zu erhalten.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
