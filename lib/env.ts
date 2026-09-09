import { z } from "zod";

/**
 * Server-only environment validation. Never import this from a "use client"
 * component — it reads secrets. Fails fast on boot instead of surfacing
 * confusing errors deep inside request handling later.
 *
 * Vars for subsystems not built yet (storage, AI) are optional here so
 * `npm run dev` isn't blocked before those phases land; each subsystem's
 * own server code re-checks its own required vars before doing anything
 * with them (see lib/storage, lib/ai once they exist).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a postgres connection string",
    ),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),
  AI_MONTHLY_BUDGET_EUR: z.coerce.number().positive().default(5),

  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_REGION: z.string().min(1).default("us-east-1"),
  STORAGE_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_SECRET_KEY: z.string().min(1).optional(),
  STORAGE_BUCKET: z.string().min(1).default("classhub"),
  STORAGE_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return parsed.data;
}

export const env = loadEnv();
