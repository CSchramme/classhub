import { peekSetupToken } from "@/lib/auth/setup-token";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SetupForm } from "./setup-form";

export default async function SetupTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await peekSetupToken(token);

  if (!result.valid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link ungültig</CardTitle>
          <CardDescription>
            {result.reason === "used"
              ? "Dieser Einrichtungslink wurde bereits verwendet."
              : result.reason === "expired"
                ? "Dieser Einrichtungslink ist abgelaufen. Bitte wende dich an deine Schule."
                : "Dieser Link ist ungültig."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konto einrichten</CardTitle>
        <CardDescription>
          Willkommen, {result.user.displayName}. Lege ein Passwort für {result.user.email}{" "}
          fest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SetupForm token={token} />
      </CardContent>
    </Card>
  );
}
