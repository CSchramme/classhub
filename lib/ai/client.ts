import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

let cachedClient: Anthropic | null = null;

/** Lazily constructed, same reasoning as lib/storage/client.ts:
 * ANTHROPIC_API_KEY is optional at boot (lib/env.ts) so `npm run dev` isn't
 * blocked before this subsystem is configured. */
export function getAiClient(): Anthropic {
  if (cachedClient) return cachedClient;
  if (!env.ANTHROPIC_API_KEY) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Die KI ist auf diesem Server nicht konfiguriert.",
    );
  }
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}
