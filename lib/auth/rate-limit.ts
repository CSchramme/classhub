import "server-only";

/**
 * In-memory sliding-window limiter for login attempts. Deliberately simple:
 * this is a single-process limitation (won't coordinate across multiple
 * server instances) — acceptable for V1, revisit with a DB/Redis-backed
 * limiter before running more than one instance. Protects against brute
 * force / rate-limit-bypass attempts on login (spec §53).
 */
const attempts = new Map<string, number[]>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(key, timestamps);
  return timestamps.length >= MAX_ATTEMPTS;
}

export function recordAttempt(key: string): void {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  attempts.set(key, timestamps);
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
