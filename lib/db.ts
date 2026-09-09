import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma 7's client requires an explicit driver adapter (no more implicit
 * connection via a schema `url`). Singleton on globalThis so Next.js's dev
 * hot-reload doesn't spawn a new connection pool on every module reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
