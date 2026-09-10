# Architecture

Status: implemented. A single-page orientation; the specific "why" behind
individual decisions lives closer to the code — `docs/database.md` for
schema/data decisions, `docs/security.md` for the security review,
`docs/ai.md` for the AI assistant, `docs/deployment.md` for running it.

## Stack

| Layer          | Choice                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router), React 19, TypeScript strict                              |
| Styling        | Tailwind CSS v4, shadcn/ui running on **Base UI** (not Radix — see below)         |
| Database       | PostgreSQL via Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`)        |
| Auth           | Custom session layer (opaque bearer tokens, DB-backed) — not NextAuth             |
| Object storage | S3-compatible (`@aws-sdk/client-s3`), server-proxied uploads                      |
| AI             | Anthropic SDK, tool-based confirm-before-mutate (see `docs/ai.md`)                |
| Validation     | Zod at every server boundary                                                      |
| Testing        | Vitest — component tests (jsdom) and real-Postgres integration tests side by side |

**Why not NextAuth for auth:** ClassHub's model is unusual for typical
auth libraries — no self-registration after bootstrap, admin-provisioned
accounts, a one-time setup-token flow, forced password rotation, and a
hard requirement that disabling a user invalidates sessions instantly.
NextAuth is built around OAuth plus either stateless JWT sessions (can't
be revoked instantly) or its own adapter model that fights these
requirements more than it helps. A thin custom layer — DB-backed opaque
session tokens, `httpOnly`/`secure`/`sameSite=lax` cookies, argon2id
hashing — keeps the security-critical logic in one auditable place
(`lib/auth/`) and makes "delete the session row" a real, instant
revocation.

**Why Base UI, not Radix:** the shadcn/ui scaffold this project started
from targets Base UI. The two have different APIs in a few places that
matter throughout this codebase — `render={<Element/>}` instead of
`asChild`, a `DropdownMenuGroup` wrapper required around
`DropdownMenuLabel`, a children-as-function pattern for `SelectValue` to
show a label instead of a raw value. These aren't optional style choices;
getting them wrong causes silent runtime failures (a menu that won't
open, a warning about default-value state), not just visual bugs.

## Server Actions vs. Route Handlers

Almost every mutation is a Server Action (`"use server"` files next to
the page that uses them), consistent with `useActionState` throughout the
UI. Route Handlers exist only where a Server Action genuinely doesn't
fit:

- `app/api/cloud/upload` / `app/api/cloud/download/[fileId]` — binary
  file bodies and, for downloads, a redirect to a signed URL.
- `app/api/cron/notifications` — called by an external scheduler, not a
  browser session; authenticated by a shared secret, not a cookie.
- `app/manifest.ts` — a Next.js file-convention route, not a REST
  endpoint of ours.

## Authorization

Every protected Server Action or Server Component calls one of the
`require*` helpers in `lib/auth/authorization.ts` before doing anything
else — `requireUser`/`requireSystemAdmin`/`requireClassMember` (throw,
for actions) or the `*OrRedirect` variants (for Server Components).
Authorization is never inferred from what the UI shows or hides; a
hidden button is not a security boundary anywhere in this app.

Ownership checks follow the same shape everywhere data is scoped to a
user or class: a lookup filtered by the owning id (`findFirst({ where:
{ id, ownerUserId: user.id } })`), never a bare `findUnique({ where: {
id } })` on something sensitive followed by a separate check — the two
are equivalent in outcome, but the filtered form can't be gotten wrong by
forgetting the follow-up check.

## Race conditions that need the database, not application logic

Three invariants in this app cannot be enforced correctly by a
read-then-write check in application code, because two concurrent
requests can both pass the read before either writes. All three are
enforced by a real database constraint or an atomic conditional update,
and all three have integration tests proving it under genuine
concurrency (`lib/auth/register.test.ts`, `lib/admin/users.test.ts`,
`lib/auth/setup-token.test.ts`, `lib/ai/confirm.test.ts`):

1. **Exactly one `SYSTEM_ADMIN` ever** — a partial unique index
   (`User_one_system_admin`), not a `count() === 0` check.
2. **One-time token/action consumption** (setup tokens, AI proposed
   actions) — an atomic `updateMany` with the "still valid" condition in
   the `WHERE` clause, not a `findUnique` followed by a separate `update`.
3. **Storage quota** — a single conditional `UPDATE ... WHERE used + size
<= quota` in the same transaction as the file insert, not a `SUM`
   query compared against the limit before inserting.

See `docs/database.md` for the specifics of each.

## A local-dev-only database quirk (not a production concern)

Manual and automated testing throughout this project used `npx prisma
dev` (Prisma's bundled ephemeral local Postgres) rather than the
`docker-compose.yml` Postgres, since Docker was unavailable in the
environment this was built in. That specific ephemeral database does not
tolerate concurrent queries well — several places in this codebase
therefore run sequential `await` calls instead of `Promise.all` for
multi-query reads (`lib/features/dashboard.ts`, `lib/storage/index.ts`,
and others reference this same reasoning in comments), and the test suite
disables Vitest's file parallelism and module isolation for the same
reason (`vitest.config.mts`). This is a property of that specific
ephemeral tool, not of PostgreSQL — a real deployment (this repo's
`docker-compose.yml`, or any managed Postgres) has no such limitation,
and reverting to `Promise.all` where it's used defensively is a
reasonable thing to revisit once real Postgres is the default dev target.
