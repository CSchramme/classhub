import { z } from "zod";

/**
 * Server-only environment validation. Never import this from a "use client"
 * component — it reads secrets. Fails fast on boot instead of surfacing
 * confusing errors deep inside request handling later.
 *
 * Vars for subsystems not built yet (storage) are optional here so
 * `npm run dev` isn't blocked before those phases land; each subsystem's
 * own server code re-checks its own required vars before doing anything
 * with them (see lib/storage).
 */

// `.env` commonly leaves not-yet-needed vars present but empty (e.g.
// `STORAGE_ENDPOINT=`) rather than omitted — Next.js loads that as `""`,
// which zod's `.optional()` does NOT treat as "absent". Coerce "" to
// undefined first so these are genuinely optional either way.
const optionalString = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  );
const optionalUrl = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional(),
  );

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

  STORAGE_ENDPOINT: optionalUrl(),
  STORAGE_REGION: z.string().min(1).default("us-east-1"),
  STORAGE_ACCESS_KEY: optionalString(),
  STORAGE_SECRET_KEY: optionalString(),
  STORAGE_BUCKET: z.string().min(1).default("classhub"),
  STORAGE_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  // Shared-secret auth for app/api/cron/notifications — the deployer's own
  // crontab (or platform scheduler) calls it periodically; there's no
  // in-app scheduler. Optional so `npm run dev` isn't blocked before it's
  // configured, same reasoning as the AI/storage vars above.
  CRON_SECRET: optionalString(),
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
