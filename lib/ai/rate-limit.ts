import "server-only";

/**
 * Same in-memory sliding-window approach as lib/auth/rate-limit.ts, kept
 * as a separate module because the limits are for a different purpose
 * (chat-abuse prevention, not login brute-force) — single-process only,
 * acceptable for V1.
 */
const attempts = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGES = 30;

export function isAiRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(userId, timestamps);
  return timestamps.length >= MAX_MESSAGES;
}

export function recordAiMessage(userId: string): void {
  const now = Date.now();
  const timestamps = (attempts.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  attempts.set(userId, timestamps);
}
