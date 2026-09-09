import { randomBytes, createHash } from "node:crypto";

/**
 * Opaque bearer token pattern for sessions and setup links: the raw token
 * is only ever held by the client (cookie / one-time URL); the database
 * stores just its SHA-256 hash. A leaked database dump can't be replayed
 * as a valid session/setup link, and there's nothing to "decrypt" — the
 * hash is looked up directly, not compared value-by-value against secrets.
 */
export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
