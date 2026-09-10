import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUserOrRedirect } from "@/lib/auth/authorization";
import { getAiAccessStatus } from "@/lib/ai/access";
import { getConversationMessages } from "@/lib/ai/conversations";
import { MessageThread } from "./message-thread";
import { ChatForm } from "./chat-form";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const user = await requireUserOrRedirect();

  const status = await getAiAccessStatus(user.id);
  if (!status.available) {
    redirect("/ki");
  }

  let messages;
  try {
    ({ messages } = await getConversationMessages(user.id, conversationId));
  } catch {
    notFound();
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 p-4 md:h-screen md:p-8">
      <Link
        href="/ki"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Alle Unterhaltungen
      </Link>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Stell eine Frage oder bitte um Hilfe — z. B. „Was habe ich diese Woche auf?“
          </p>
        ) : (
          <MessageThread messages={messages} />
        )}
      </div>

      <ChatForm conversationId={conversationId} />
    </div>
  );
}
