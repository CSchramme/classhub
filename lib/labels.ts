import type { UserStatus, AuditAction } from "@/generated/prisma/client";

/** Shared German labels for admin UI — used across the user list, user
 * detail, and audit log pages, so they're kept here once rather than
 * risking drift between copies. `Record<Enum, string>` makes TypeScript
 * flag it if a new enum value is ever added without a label. */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Aktiv",
  PENDING_SETUP: "Einrichtung ausstehend",
  DISABLED: "Deaktiviert",
  PASSWORD_CHANGE_REQUIRED: "Passwortwechsel nötig",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_CREATED: "Benutzer erstellt",
  USER_DISABLED: "Benutzer deaktiviert",
  USER_ENABLED: "Benutzer aktiviert",
  USER_ASSIGNED_TO_CLASS: "Klasse zugewiesen",
  USER_REMOVED_FROM_CLASS: "Aus Klasse entfernt",
  PASSWORD_RESET_REQUESTED: "Passwort-Reset angefordert",
  PASSWORD_CHANGE_REQUIRED: "Passwortwechsel erzwungen",
  FILE_UPLOADED: "Datei hochgeladen",
  FILE_DELETED: "Datei gelöscht",
};
