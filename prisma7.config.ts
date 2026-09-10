import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma's CLI (generate/migrate/seed) runs outside Next.js and does not
// load .env on its own in Prisma 7 — hence the explicit dotenv import above.
// This file is intentionally standalone (no @/lib/env import): the CLI
// loads it directly, without Next.js's module resolution/path aliases.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
