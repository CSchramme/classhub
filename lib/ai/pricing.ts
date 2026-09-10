import "server-only";

/**
 * Rough per-million-token rates (in EUR) for budget-guardrail purposes only
 * — not a real billing feed. There's no API to read back exact spend per
 * request, so this is a best-effort estimate against Anthropic's published
 * per-token pricing tiers, close enough to catch runaway usage before it
 * blows a user's monthly budget. Update if the configured model changes
 * pricing tier.
 */
const PRICING_EUR_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> =
  {
    "claude-sonnet-5": { input: 3, output: 15 },
    "claude-opus-5": { input: 15, output: 75 },
    "claude-haiku-4-5": { input: 1, output: 5 },
  };

const DEFAULT_RATE = { input: 3, output: 15 };

export function estimateCostEur(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rate = PRICING_EUR_PER_MILLION_TOKENS[model] ?? DEFAULT_RATE;
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
}
