import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { getAiAccessStatus } from "@/lib/ai/access";
import { listConversations } from "@/lib/ai/conversations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewConversationButton } from "./new-conversation-button";
import { ConversationList } from "./conversation-list";

export default async function AiIndexPage() {
  const user = await requireUserOrRedirect();
  const status = await getAiAccessStatus(user.id);

  if (!status.available) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KI-Assistent</h1>
        </div>
        <Card className="max-w-lg">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {status.reason === "GLOBALLY_DISABLED"
              ? "Die KI-Funktion ist auf dieser Plattform derzeit deaktiviert."
              : "Du hast noch keinen Zugriff auf die KI-Funktion. Wende dich an deine Schuladministration."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversations = await listConversations(user.id);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KI-Assistent</h1>
          <p className="text-muted-foreground">
            Hilfe bei Hausaufgaben, To-Dos und mehr.
          </p>
        </div>
        <NewConversationButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unterhaltungen</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Unterhaltungen. Starte eine neue.
            </p>
          ) : (
            <ConversationList conversations={conversations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
