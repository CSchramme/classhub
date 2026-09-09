# Security

Status: placeholder — expanded through Phase 3 (Auth) and Phase 18 (Security Audit).

## Known accepted risk (Phase 1)

`npm audit` reports high-severity advisories in `mysql2` and `deepmerge-ts`, pulled in transitively by the `prisma` CLI's MySQL connector support. ClassHub only ever connects to PostgreSQL (see `lib/env.ts` — `DATABASE_URL` is validated to be a `postgres://` URL), so this MySQL-only code path is never exercised. Fixing it would require downgrading `prisma`/`@prisma/client` to an older major version, which isn't worth it for an unused driver. Revisit if Prisma ships a fix in the 7.x line.
