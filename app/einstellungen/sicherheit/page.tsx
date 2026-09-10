import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export default function SecuritySettingsPage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Passwort ändern</CardTitle>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
}
