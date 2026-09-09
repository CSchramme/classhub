import { Prisma } from "../generated/prisma/client";

/**
 * Prisma 7's driver-adapter engine does NOT populate `error.meta.target`
 * for unique-constraint violations the way older Prisma versions did
 * (verified empirically — see docs/database.md). The actual Postgres
 * constraint/index name instead lives at
 * `error.meta.driverAdapterError.cause.constraint.index`. This matters
 * for our hand-added partial unique indexes (User_one_system_admin,
 * ClassMembership_one_active_per_user_class), which Prisma doesn't know
 * about from the schema and so can't map to field names — the index name
 * is the only reliable way to tell them apart from an ordinary unique
 * violation (e.g. a duplicate email).
 */
export function getViolatedConstraintIndex(error: unknown): string | undefined {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return undefined;
  }
  const meta = error.meta as
    { driverAdapterError?: { cause?: { constraint?: { index?: string } } } } | undefined;
  return meta?.driverAdapterError?.cause?.constraint?.index;
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
