import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

export type AiAccessStatus =
  | { available: true }
  | { available: false; reason: "GLOBALLY_DISABLED" | "NO_PERMISSION" };

/**
 * Two independent gates, both required (spec §35/§51): the admin-controlled
 * global switch, and a per-user grant (UserPermission AI_ACCESS, already
 * wired up from the admin/benutzer "KI freigeben" action). No SYSTEM_ADMIN
 * bypass here unlike requireClassMember — every AI call costs real money,
 * so admins aren't implicitly exempt from needing an explicit grant.
 */
export async function getAiAccessStatus(userId: string): Promise<AiAccessStatus> {
  const settings = await db.systemSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.aiGloballyEnabled) {
    return { available: false, reason: "GLOBALLY_DISABLED" };
  }

  const permission = await db.userPermission.findUnique({
    where: { userId_key: { userId, key: "AI_ACCESS" } },
  });
  if (!permission) {
    return { available: false, reason: "NO_PERMISSION" };
  }

  return { available: true };
}

export async function requireAiAccess(userId: string): Promise<void> {
  const status = await getAiAccessStatus(userId);
  if (!status.available) {
    throw new AppError(
      "FORBIDDEN",
      status.reason === "GLOBALLY_DISABLED"
        ? "Die KI-Funktion ist derzeit deaktiviert."
        : "Du hast keinen Zugriff auf die KI-Funktion.",
    );
  }
}
