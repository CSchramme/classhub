# Deployment

Status: implemented (Phase 20). This describes running ClassHub on your own
server: `git pull` the built app, run it behind a reverse proxy that
terminates TLS. There's no managed-hosting-specific instructions here
(no Vercel/Docker-image build) — adapt the "run the process" step if you
use one.

## Prerequisites

- Node.js 22+ (matches what this app was built and tested against)
- PostgreSQL 16+ (a plain server, or the `docker-compose.yml` in this repo)
- An S3-compatible object store for Cloud storage (MinIO via the same
  `docker-compose.yml`, or AWS S3/R2/etc.) — optional at boot, but Cloud
  storage won't work without it (see `lib/storage/client.ts`)
- A reverse proxy that terminates TLS (nginx, Caddy, etc.) — `next start`
  serves plain HTTP; it does not do TLS itself. This matters beyond just
  encryption: session cookies only get the `secure` flag when
  `NODE_ENV=production` (`lib/auth/session.ts`), and a `secure` cookie is
  silently dropped by browsers over plain HTTP, breaking login.
- An Anthropic API key, only if you want the AI assistant working
  (`/admin/ki` still lets you toggle the feature off entirely without one)

## First-time setup

```bash
git clone https://github.com/CSchramme/classhub.git
cd classhub
npm ci
cp .env.example .env
```

Fill in `.env` — at minimum `DATABASE_URL`, a real generated `AUTH_SECRET`
(`openssl rand -base64 32`), and `NEXT_PUBLIC_APP_URL` set to your real
public URL. Everything else (`ANTHROPIC_API_KEY`, `STORAGE_*`,
`CRON_SECRET`) can stay empty until you're ready for that subsystem — see
`lib/env.ts`, each is independently optional at boot.

If you're using this repo's `docker-compose.yml` for Postgres/MinIO:

```bash
docker compose up -d
```

Apply the schema and start the app:

```bash
npm run db:migrate:deploy
npm run build
npm start
```

`db:migrate:deploy` runs `prisma migrate deploy` — the non-interactive
command meant for this. Never run `npm run db:migrate` (`prisma migrate
dev`) against a production database; it's a development command that can
prompt interactively and isn't safe unattended.

`npm start` runs the Next.js server in the foreground on the port in
`PORT` (default 3000). Run it under a real process manager (systemd,
pm2) so it restarts on crash and on reboot — this repo doesn't ship a
process-manager config, since that choice depends on your server.

Point your reverse proxy at that port and terminate TLS there.

### Bootstrap the first admin

Visit `/register` once. The first account created becomes `SYSTEM_ADMIN`
(race-safe even if two people happen to load it at once — see
`docs/database.md`); after that, public registration is closed for good.
Every other account is created from `/admin/benutzer`, which issues a
one-time setup link instead of a password.

## Updating

```bash
git pull
npm ci
npm run db:migrate:deploy
npm run build
```

Then restart the process (however your process manager does that).
`prisma migrate deploy` only applies migrations that haven't run yet, so
this is safe to run on every deploy even when nothing changed.

## Notification reminders (cron)

`EXAM_UPCOMING` and `EVENT_REMINDER` notifications aren't created by
anything running inside the app — there's no in-app scheduler. Something
external has to call the endpoint periodically:

```bash
curl -s -X POST https://your-domain/api/cron/notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

A crontab entry running this hourly is enough — the endpoint dedupes
against notifications it already sent (see `lib/notifications/reminders.ts`),
so calling it more often than needed just does nothing extra, not extra
notifications. Without `CRON_SECRET` set in `.env`, the endpoint refuses
every request with 503.

## Storage and database backups

Neither is handled by the app. At minimum:

- `pg_dump` the Postgres database on a schedule.
- Back up (or use versioning on) whatever bucket `STORAGE_BUCKET` points
  at — it holds every uploaded file, private and class clouds both.

## Environment variables reference

See `.env.example` for the full list with comments. The ones that most
affect production behavior specifically:

| Variable                | Effect                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `NODE_ENV=production`   | Set automatically by `next start`; makes session cookies `secure` (HTTPS-only)         |
| `AUTH_SECRET`           | Must be a real random value — the placeholder in `.env.example` is intentionally blank |
| `NEXT_PUBLIC_APP_URL`   | Used to build absolute links (e.g. setup-link emails/URLs shown in the admin UI)       |
| `AI_MONTHLY_BUDGET_EUR` | A single number applied to every user, not configurable per-user                       |
| `CRON_SECRET`           | Required for the reminder cron endpoint to accept any request at all                   |
