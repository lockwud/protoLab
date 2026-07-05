# ProtoLab — Build Log

## Session summary

Built ProtoLab end-to-end in one autonomous build/test/fix session: Next.js
16 App Router + TypeScript + Tailwind v4 + hand-rolled shadcn-style UI +
PostgreSQL + JWT auth + AI abstraction + GitHub integration, across all 12
requested modules.

## What was built

- **Auth & roles**: register/login/logout via JWT cookie session (`jose`,
  edge-compatible), bcrypt password hashing, `proxy.ts` (Next 16's renamed
  middleware) enforcing role-based routing for Student/Lecturer/Admin.
- **Database**: full schema in `prisma/schema.prisma` (12 models — User,
  Course, Enrollment, Assignment, Submission, Project, Milestone, Feedback,
  Document, AiSession, InnovationRepository, Notification). Applied to a
  real local Postgres 16 instance via hand-derived `prisma/init.sql`.
- **Courses**: create (lecturer), list (role-aware), self-enrollment
  (student) or lecturer-enrolls-by-email.
- **Assignments**: draft/publish workflow, due dates, student submission
  (create/update), lecturer grading + feedback, notifications on publish and
  on submit.
- **Projects (prototypes)**: creation auto-seeds a 5-step milestone roadmap;
  status lifecycle (Planning → Building → Testing → Review → Shipped).
- **AI abstraction** (`src/lib/ai.ts`): tries Claude first, falls back to
  Gemini, and returns a clearly-labeled disabled state (not a crash) if
  neither key is set. Powers:
  - AI Prototype Assistant (freeform Q&A per project)
  - Prototype Planning Engine (`/api/ai/plan` — milestone suggestions)
  - Documentation Generator (README / Report / Pitch, saved as `Document` rows)
- **GitHub integration** (`src/lib/github.ts`): Octokit-based repo info /
  user repo listing, safe fallback + manual repo-URL linking when no
  `GITHUB_TOKEN` is set.
- **Milestone tracking**: status board (Pending/In progress/Done/Blocked),
  add milestone, inline status updates.
- **Lecturer review & feedback**: per-submission grading (0–100) + comment,
  per-project feedback + 1–5 rating.
- **Innovation repository**: publish a project with tags; public listing
  page.
- **Analytics**: lecturer-only dashboard — projects/submissions/milestones
  by status, active student count.
- **Notifications**: in-app, created on assignment publish, submission
  received, feedback given; mark-as-read.

## Issues hit and how they were fixed

1. **Prisma engine binaries blocked by sandbox network policy.**
   `prisma generate` / `migrate dev` need to fetch Rust engine binaries from
   `binaries.prisma.sh`, which is outside this sandbox's allowed domains
   (confirmed via repeated 403s even with `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`
   and the newer Rust-free `engineType = "client"` mode, which still needs the
   schema-engine for `generate`). No local/cached binary existed either.
   **Fix**: kept `prisma/schema.prisma` as the canonical schema, hand-derived
   an equivalent `prisma/init.sql`, and built the data-access layer on `pg`
   directly. This is documented clearly in the README as a sandbox-specific
   workaround — on a normal machine, `npx prisma generate` / `migrate dev`
   should work fine against the same schema.

2. **shadcn CLI (`shadcn init`) blocked.** It calls `ui.shadcn.com`, also
   outside the sandbox allowlist. **Fix**: hand-rolled the standard shadcn
   component source (Button, Card, Input, Textarea, Label, Badge, Separator,
   Tabs, Select, Avatar) directly, using the same CSS-variable Tailwind
   convention so real shadcn `add` commands would still integrate cleanly
   later.

3. **`jsonwebtoken` in middleware.** Next's middleware/proxy runs on the Edge
   runtime, and `jsonwebtoken` depends on Node's `crypto` module, which isn't
   available there. **Fix**: switched the whole app to `jose` for signing/
   verifying session JWTs (edge- and node-compatible), removing
   `jsonwebtoken` entirely.

4. **`useSearchParams()` without a Suspense boundary** broke static export of
   `/login` during `next build` ("should be wrapped in a suspense boundary").
   **Fix**: wrapped the login form in `<Suspense>`.

5. **Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`.** Build
   emitted a deprecation warning; renamed the file and its exported function
   (`middleware` → `proxy`) to match the new convention, which also resolved
   the warning.

6. **TypeScript union-narrowing ambiguity** in the Prototypes list page (`"x"
   in row` didn't narrow a mapped-union row type cleanly, causing a
   `ReactNode`/`unknown` type error). **Fix**: normalized both branches to an
   explicit shared type before rendering instead of relying on `in`-narrowing.

7. **Lint warnings** (unused import, unused destructured var, a false-positive
   `no-page-custom-font` rule against the App Router's `layout.tsx`, and a
   stale `eslint-disable` comment). **Fix**: cleaned all four; `npm run lint`
   is now 0 errors/0 warnings.

## Verification performed this session

- `npx tsc --noEmit` → clean.
- `npm run lint` → clean.
- `npm run build` → succeeds; 33 routes compiled (10 static/prerendered,
  23 dynamic/server-rendered).
- Started the production build (`next start`) against a real local Postgres
  16 instance and ran a full scripted smoke test covering: register (both
  roles), login, course creation, enrollment, assignment publish +
  notification, submission, grading + feedback, project creation with
  auto-seeded milestones, milestone status update, project-level feedback,
  repository publish + public listing, notifications list, lecturer
  analytics, and the AI/GitHub safe-fallback paths (both correctly report
  "disabled" with a clear message since no API keys are configured in this
  environment).
- Verified role-based route protection: unauthenticated `/dashboard` →
  redirects to `/login`; student hitting `/dashboard/lecturer` → redirected
  back to `/dashboard/student`, and vice versa.

## What still needs work (see README "Known limitations" for the full list)

- Wire the Prototype Planning Engine (`/api/ai/plan`) into the "New
  Prototype" creation form's UI (API + AI logic already work).
- GitHub OAuth login flow (only token-based REST reads are implemented).
- File upload support for submissions (currently URL-based).
- No automated test suite (Jest/Playwright) yet — this session's
  verification was `tsc` + `eslint` + `next build` + a live scripted smoke
  test, not unit/e2e tests.
- No dedicated Admin UI (role exists in schema/permissions only).
