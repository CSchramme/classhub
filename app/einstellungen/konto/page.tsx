import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function AccountSettingsPage() {
  const user = await requireAuthenticatedUser();

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Konto</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForm
          firstName={user.firstName}
          lastName={user.lastName}
          displayName={user.displayName}
          email={user.email}
        />
      </CardContent>
    </Card>
  );
}
