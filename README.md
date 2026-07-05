# ProtoLab

AI-powered innovation learning and prototype development platform for Students and Lecturers.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + hand-rolled shadcn/ui-style component library
- PostgreSQL via `pg` (node-postgres), schema defined in `prisma/schema.prisma`
- JWT sessions (via `jose`, edge-compatible) + bcrypt password hashing
- Claude / Gemini AI abstraction with safe fallback
- GitHub REST API (Octokit) integration with safe fallback
- pnpm

> **A note on Prisma**: `prisma/schema.prisma` is the canonical schema. In the
> sandbox this project was built in, `prisma generate` / `migrate` could not
> reach `binaries.prisma.sh` (network egress policy), so the data-access layer
> uses `pg` directly against `prisma/init.sql` (hand-derived from the exact
> same schema). On a normal machine with regular internet access, both paths
> work — see "Using the real Prisma Client" below if you'd prefer that instead
> of the `pg` layer that ships by default.

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Postgres

Any Postgres 14+ works. Locally on Ubuntu/Debian:

```bash
sudo apt-get install -y postgresql
sudo service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE protolab;"
```

Or with Docker:

```bash
docker run --name protolab-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=protolab -p 5432:5432 -d postgres:16
```

### 3. Configure environment

```bash
cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET at minimum
```

### 4. Create the schema

```bash
pnpm db:migrate
# equivalent to: psql "$DATABASE_URL" -f prisma/init.sql
```

### 5. (Optional) Seed demo data

```bash
pnpm db:seed
```

This creates one lecturer and two students (password `password123` for all):
- `lecturer@protolab.dev`
- `student1@protolab.dev`
- `student2@protolab.dev`

...plus a course, a published assignment, and a prototype project with a
seeded milestone roadmap.

### 6. Run the app

```bash
pnpm dev
```

Visit `http://localhost:3000`.

## Enabling optional features

- **AI Prototype Assistant / Planning Engine / Documentation Generator**: set
  `CLAUDE_API_KEY` or `GEMINI_API_KEY` in `.env`. Without either, the UI shows
  a clear "AI features are disabled" message instead of crashing.
- **GitHub integration**: set `GITHUB_TOKEN` (a personal access token with
  `repo` scope is enough for read access). Without it, you can still store a
  repo URL manually on a project; live GitHub status is simply unavailable.

## Using the real Prisma Client (optional, on a machine with normal internet access)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Then swap the `pg`-based functions in `src/lib/db.ts` / `src/lib/data.ts` for
`@prisma/client` calls if you'd prefer Prisma's query API over raw SQL. The
schema is identical either way, so no data model changes are needed.

## Project structure

```
src/
  app/
    (auth)/login, (auth)/register        — auth pages
    (dashboard)/...                       — role-gated app shell + pages
    api/...                               — route handlers (REST-ish JSON API)
  components/ui/                          — hand-rolled shadcn-style primitives
  components/shared/                      — dashboard shell, nav
  lib/                                    — db, auth, session, ai, github, env, data
  types/                                  — shared TS types
  proxy.ts                                — role-based route protection (Next 16 "proxy", formerly middleware)
prisma/
  schema.prisma                           — canonical schema (Prisma format)
  init.sql                                — hand-derived SQL migration (used by pnpm db:migrate)
  seed.ts                                 — demo data
```

## Modules implemented

| # | Module | Status |
|---|---|---|
| 1 | Auth + role-based routing | ✅ Working (JWT cookie session, Student/Lecturer/Admin roles) |
| 2 | Courses | ✅ Working (create, list, enroll) |
| 3 | Assignments | ✅ Working (draft/publish, submit, grade) |
| 4 | AI prototype assistant | ✅ Working with real API when a key is set; safe fallback otherwise |
| 5 | Prototype planning engine | ✅ API implemented (`/api/ai/plan`); not yet wired into the New Prototype form UI |
| 6 | Documentation generator | ✅ Working (README/Report/Pitch generation from a project) |
| 7 | GitHub integration | ✅ Working with real API when `GITHUB_TOKEN` is set; safe fallback + manual repo URL otherwise |
| 8 | Milestone tracking | ✅ Working (auto-seeded roadmap, status board) |
| 9 | Lecturer review & feedback | ✅ Working (project feedback + submission grading) |
| 10 | Innovation repository | ✅ Working (publish + public listing) |
| 11 | Analytics | ✅ Working (status breakdowns for projects/submissions/milestones) |
| 12 | Notifications | ✅ Working (in-app, created on publish/submit/feedback events) |

See `BUILD_LOG.md` for the detailed build history, issues hit, and fixes applied.

## Verified build checks (this session)

```
npx tsc --noEmit    → 0 errors
npm run lint        → 0 errors, 0 warnings
npm run build       → succeeds, 33 routes compiled
smoke test          → auth, courses, enrollment, assignments, submissions,
                       grading, projects, milestones, feedback, repository,
                       notifications, analytics, AI fallback, GitHub fallback
                       all exercised against a live Postgres instance
```

## Known limitations

- Prototype Planning Engine API exists but isn't yet surfaced as a button in
  the "New Prototype" form (currently only reachable via `/api/ai/plan`).
- GitHub OAuth login flow is not implemented — only token-based REST API
  reads (repo info, list user repos) and manual repo-URL linking.
- No file uploads yet; submissions accept a `fileUrl` string field (e.g. a
  link to a hosted file) rather than binary upload.
- No automated test suite (unit/e2e) — verification in this session was via
  `tsc`, `eslint`, `next build`, and a live smoke-test script against Postgres.
- Admin role exists in the schema/permissions but has no dedicated UI yet.
