# ClassHub

„Alles für deine Schule. An einem Ort.“

ClassHub is a production-grade school platform: dashboard, homework, to-dos,
timetable, events, exams, subjects, private/class cloud storage, an
AI assistant, admin/user management, and audit logging — built as one
Next.js app on top of PostgreSQL.

Status: early build, in progress phase by phase. See [docs/routes.md](./docs/routes.md)
for what's actually implemented vs. planned.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Prisma · PostgreSQL · S3-compatible object storage · Anthropic API

See [docs/architecture.md](./docs/architecture.md), [docs/security.md](./docs/security.md).

## Local development

Requirements: Node 22+, npm, Docker (for local Postgres + MinIO).

```bash
cp .env.example .env    # fill in AUTH_SECRET etc. — see comments in the file
docker compose up -d    # starts Postgres (5432) and MinIO (9000/9001)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # start the dev server
npm run build        # production build
npm run start        # run the production build
npm run lint          # ESLint
npm run typecheck    # TypeScript, no emit
npm run test          # Vitest
npm run db:generate    # generate the Prisma client
npm run db:migrate     # run Prisma migrations (dev)
npm run db:seed        # seed the database (dev only, never fake prod data)
```
