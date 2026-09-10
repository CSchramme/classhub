# Security

Status: implemented (Phase 18). A dedicated review pass across authentication,
authorization, injection risks, headers, dependencies, and rate limiting,
read against the actual codebase rather than assumed from what was
intended. Two real, exploitable findings came out of it; both are fixed.
Everything else is either a verified non-issue or a documented,
accepted defense-in-depth gap.

## Fixed during this review

### 1. IDOR: any class member could delete any other class's timetable entry

`deleteTimetableEntryAction` checked `requireClassMember(classId)` against
the _caller's own_ class, then `deleteTimetableEntry` deleted the entry by
bare `id` with no check that the entry actually belonged to that class.
`entryId` and `classId` are two independent client-supplied parameters —
an authenticated user in any class could pass their own `classId` (to
satisfy the membership check) together with an arbitrary entry id from a
different class and delete it.

Fixed in `lib/features/timetable.ts`: `deleteTimetableEntry` now takes
`classId` and scopes the lookup to `{ id: entryId, classId }` before
deleting — the same ownership-filter shape used everywhere else in this
codebase for class- and user-scoped data (`lib/storage/index.ts`'s
`ownerWhere`, `lib/features/homework.ts`'s `requireHomeworkAuthor`,
`lib/features/todos.ts`, `lib/features/exams.ts`, `lib/features/events.ts`).
This was the one place that pattern was dropped — `createTimetableEntry`
was never affected, since it builds the new row from the already
membership-checked `classId` rather than trusting a second, independent
id. Regression test: `lib/features/timetable.test.ts`.

### 2. Login rate limiter bypassable via a spoofed `X-Forwarded-For` header

The login/register/setup-token flows read the client IP as
`headerList.get("x-forwarded-for")?.split(",")[0]`. `X-Forwarded-For` is
attacker-controlled on any request that reaches the app — a client can
set it to anything — and taking the _first_ (leftmost) value reads
exactly the part of the header the client wrote, not anything a trusted
proxy added. Worse, the default nginx directive
(`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`) _appends_
to whatever the client sent rather than replacing it, so even the
documented reverse-proxy deployment doesn't protect this on its own. The
login rate-limit key is `login:${ip}:${email}`, so an attacker
brute-forcing one specific account could set a different
`X-Forwarded-For` value on every request and get a fresh, empty bucket
every time — the 10-attempts/15-minute limiter was a no-op against a
targeted account.

Fixed two ways:

- `lib/auth/request-ip.ts` (new): reads the **last** value in the
  `X-Forwarded-For` chain instead of the first — the value our own
  reverse proxy is closest to having appended, under the single-hop
  topology `docs/deployment.md` documents. Used consistently everywhere
  the app reads this header (login, register, setup-token — previously
  each had its own inline copy of the same `.split(",")[0]` logic).
- `app/(auth)/login/actions.ts`: added a second rate-limit bucket keyed
  by email alone (`login-email:${email}`), checked alongside the
  existing `ip+email` bucket — either one being tripped blocks the
  attempt. This is the real fix: it doesn't depend on IP extraction being
  correct at all, so even a topology this app doesn't anticipate (extra
  proxy hops, a misconfigured header) can't be used to spread a
  brute-force attack on one account across fabricated IPs.

Not extended to `register`'s IP-only limiter: registration has no
existing account to key on (it's only reachable pre-bootstrap, before any
user exists — see `lib/auth/register.ts`), so an email-based backstop
doesn't apply the same way; the corrected IP extraction is the relevant
fix there.

## Reviewed and confirmed clean

- **XSS**: no `dangerouslySetInnerHTML`/`innerHTML` anywhere in the
  codebase. All user-supplied content (chat messages, announcements,
  homework/todo/event titles) renders as plain JSX text, which React
  escapes by default.
- **SQL injection**: no `$queryRaw`/`$executeRaw`/raw SQL string
  concatenation anywhere — every database call goes through Prisma's
  parameterized query builder.
- **Secrets**: `.env` is gitignored and was never committed; only
  `.env.example` (placeholder values) is tracked. No client-bundled code
  references a secret-shaped environment variable — every `lib/`
  business-logic module that touches secrets is guarded with
  `import "server-only"`.
- **File upload / path traversal**: S3 object keys are built only from a
  server-issued owner id and `crypto.randomUUID()` — the user-supplied
  filename contributes at most a whitelist-filtered extension, never a
  path component (`lib/storage/index.ts`).
- **Error handling**: every Server Action and Route Handler routes caught
  errors through `toActionError`, which logs the real error server-side
  and returns only a safe, generic message to the client — no stack
  traces or internal details leak.
- **Audit log**: `writeAuditLog` metadata is, in practice as well as by
  the comment, never used with passwords, tokens, or other secrets — only
  ids, names, and counts.

## Accepted, documented risk

### `npm audit`: 4 high-severity advisories, unreachable at runtime

All four trace to one transitive chain: `prisma` (the CLI, a direct
dependency since `prisma generate`/`migrate` need to run at
build/deploy time) pulls in `@prisma/config`, which pulls in
`deepmerge-ts` (stack-exhaustion advisory) and, via the CLI's optional
MySQL-connector code, `mysql2` (auth-downgrade and decompression-bomb
advisories). `lib/env.ts` validates `DATABASE_URL` must start with
`postgres://`/`postgresql://`, so the vulnerable MySQL code path can
never execute — this app cannot be configured to use MySQL. The `npm
audit fix` path requires downgrading to `prisma@6.x`, a breaking
migration away from the driver-adapter architecture (`@prisma/adapter-pg`)
this app is built on; not worth it for a dependency chain that's never
exercised. Revisit if Prisma ships a fix within the 7.x line.

### Content-Security-Policy: not set

`proxy.ts` sets `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, and `Permissions-Policy`, but no CSP header exists
anywhere in the app. Given there is currently no HTML-injection sink
anywhere in the codebase (see XSS above), a CSP's main practical benefit
here is currently redundant — but it's a standard, cheap layer that
would matter immediately if any future change introduces one (a
rich-text renderer, a third-party embed, a script tag). Worth adding
before any such change lands, not urgent today. `X-Frame-Options: DENY`
already covers the clickjacking protection a `frame-ancestors 'none'`
CSP directive would add.

### Cookie `Secure` flag depends on `NODE_ENV=production` being set correctly

`lib/auth/session.ts` sets the session cookie's `secure` flag from
`env.NODE_ENV === "production"` — `env` being `lib/env.ts`'s Zod-validated
singleton (fixed during this review to read from there instead of
`process.env.NODE_ENV` directly, closing a small inconsistency where the
app already validated `NODE_ENV` but this one call site bypassed that
validation). Under the deployment path this project documents (`next
build && next start`), Next.js sets `NODE_ENV=production` on its own, so
this resolves correctly either way — the fix is about having one
validated source of truth, not a change in actual behavior for the
documented deployment path.

### Rate limiting: not everywhere, deliberately

Covered: login (ip+email and email-only buckets), registration (IP,
bootstrap-only anyway), AI messages (per-user hourly cap plus a monthly
€ budget). Not covered, each judged low-risk enough not to need it yet:

- **Setup-token consumption** — the token is a 256-bit random value
  (`randomBytes(32)`); online brute-forcing it is computationally
  infeasible regardless of throttling.
- **Password change** (`changePassword`'s current-password check) —
  requires an already-authenticated session to reach; an attacker with a
  hijacked session already has full account access regardless.
- **Admin mutations** (user/class/school creation, AI toggle, etc.) — all
  gated by `requireSystemAdmin()`; exploitation already requires a
  compromised admin account.
- **Content-creation actions** (todos, homework, exams, events, uploads)
  — bounded by Zod length caps and storage quotas per request, but not
  per time window. A malicious class member could script rapid content
  creation to spam class notifications or run up storage API calls.
  Worth a shared per-user rate limit if this becomes a real problem in
  practice; not built preemptively for a threat that hasn't materialized.

## What this review did not cover

Dependency licenses, infrastructure/network-level hardening (firewall
rules, the reverse proxy's own TLS configuration), and anything requiring
a live deployment to test (e.g. actual HTTPS behavior) are out of scope
for a code-level review — see `docs/deployment.md` for the operational
side of running this securely.
