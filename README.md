# collecto

A private personal Collection and memory library. Create a Collection from a preset or Blank, customize its Fields, save Items with an optional private image, browse Select-based virtual folders, and choose how its gallery looks.

**Release status:** implemented and locally verified; not deployed or release-approved. The six-width/device accessibility acceptance pass is still open under M7-T02. Browser testing is excluded by the current project owner's instruction. See [release verification](docs/release-verification.md) for evidence and exceptions, and [tasks](docs/tasks.md) for status.

## Features

- Email/password authentication and private, owner-scoped data.
- Books, Movies, Music, Collectibles, Shopping, Meals, Travel, Favorites and Blank presets. Edit the draft schema before Create; later schema changes remain independent of presets.
- Required built-in Title, optional Description, and ordered Text, Number, Date, Rating, Select and URL Fields. Persisted Field types are immutable.
- Item create/edit/details/delete and zero or one JPEG, PNG or WebP image, up to 5 MB.
- Select-derived folders, including Uncategorized; Browse state survives refresh through validated URL parameters.
- One saved gallery per Collection: 1–5 preferred columns, five image ratios, cover/contain, details on/off, up to three ordered visible Fields, spacing and sorting. Narrow containers cap the effective columns.
- Confirmed permanent deletion, durable private-image cleanup, custom validation, transient notifications and loading feedback.
- A shared writable demo with fictional seed data and an admin-only confirmed reset command.

## Requirements

- Node **22.18+** or Node **24+**; pnpm **11.25.0** via Corepack. Install Corepack separately if your Node distribution does not include it.
- A Supabase project, or Docker plus the Supabase CLI for local development and integration tests. The local verification used Supabase CLI **2.122.0** and PostgreSQL **17**.
- Network access for an initial dependency install and optimized Google font builds, unless cached. No production credentials are supplied by this repository.

## Run locally

From the repository root:

```powershell
corepack pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

Fill the three required public values in the ignored `.env.local` file:

| Variable                               | Purpose                                         |
| -------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project API URL                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe project publishable key            |
| `NEXT_PUBLIC_SITE_URL`                 | App origin, for example `http://127.0.0.1:3000` |

These values must be populated even for production builds. Blank or invalid values produce `Invalid environment configuration`; restart the dev process after changing them. Use the Supabase API URL and publishable key from the **same project**. A secret/service-role key must never be used as the public key.

```powershell
corepack pnpm dev
```

Open `http://127.0.0.1:3000`, create an account or log in, then create a Collection. If using `localhost` instead, use it consistently in the app origin and Auth redirect configuration.

### Local Supabase

```powershell
corepack pnpm dlx supabase@2.122.0 start
corepack pnpm dlx supabase@2.122.0 status
```

The checked-in configuration uses API port **55321**, database port **55322**, and Studio port **55323**. Read actual running values from CLI status; do not substitute Supabase's default port from an unrelated guide. Status can display secret keys—do not paste or commit its full output.

On a disposable local database, apply the full migration history with:

```powershell
corepack pnpm dlx supabase@2.122.0 db reset --local
```

**This deletes local database data.** Use it only for a disposable stack. It is not the demo reset command. Automatic SQL seeding is disabled; the demo uses its separate protected workflow. For an existing local database, apply pending migrations through your normal migration process instead of resetting it.

Local email confirmation is disabled by the checked-in configuration. Hosted Supabase may require confirming email before login. Configure the intended app origin and `/auth/callback` redirect in hosted Supabase Auth; do not add arbitrary redirect destinations. Hosted migrations must include **all** files under `supabase/migrations`, in order, including the admin demo migration. Connecting or migrating a hosted project is an operator action, not part of this local setup verification.

### Optional server-only configuration

| Variable                 | Needed for                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| `SUPABASE_SECRET_KEY`    | Admin demo seeding/reset and the Storage-cleanup worker              |
| `STORAGE_CLEANUP_SECRET` | Protecting `POST /api/admin/storage-cleanup`; at least 16 characters |
| `DEMO_USER_EMAIL`        | Showing the shared-demo notice for the configured account            |
| `DEMO_USER_ID`           | Admin CLI target UUID; verified against the configured email         |

Basic authenticated application requests use the user's session and RLS. Admin credentials belong only in private environment files or managed deployment secrets. Do not commit `.env`, `.env.local`, passwords, tokens or populated CLI output.

## Verify

```powershell
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test --maxWorkers=1
corepack pnpm audit --prod
corepack pnpm build
```

To run the production build locally after configuring the required values:

```powershell
corepack pnpm start
```

With Docker and the migrated local Supabase stack available:

```powershell
corepack pnpm test:database
corepack pnpm test:auth:ssr
corepack pnpm test:storage
corepack pnpm test:security:sessions
corepack pnpm test:demo
```

Database suites roll back their fixtures. API suites create random temporary users and clean them up; they reject nonloopback API URLs. They discover local credentials through CLI status, or accept all three private process variables `LOCAL_SUPABASE_URL`, `LOCAL_SUPABASE_PUBLISHABLE_KEY`, and `LOCAL_SUPABASE_SECRET_KEY` together. Set `LOCAL_SUPABASE_DB_CONTAINER` only if your local database container differs from `supabase_db_collecto`.

API auto-discovery currently invokes an unpinned `pnpm dlx supabase` independently of the pinned setup commands above. Supplying the three `LOCAL_SUPABASE_*` variables avoids that resolution; keep their values private.

Existing Playwright tests are available through `corepack pnpm test:e2e`, but are **not included in current verification** and were not run under the owner's no-browser instruction. Do not interpret unit/axe tests as rendered viewport or full WCAG certification. See [accessibility audit](docs/accessibility-audit.md) and [security evidence](docs/security-verification.md).

## Demo and cleanup operations

See [demo operations](docs/demo-operations.md) before seeding or resetting. The seed contains **My Books**, **Food Memories**, and **My Collectibles**, six fictional Items each, with no image files. Repeated seeding preserves visitor edits; explicit reset permanently replaces the configured demo owner's Collections and queues old images for cleanup. The seed command does not create the account, set its password, or run automatically on startup.

The demo is shared and writable: other visitors see changes, the last saved edit wins, and data may be reset. Use fictional information only. The owner controls account credentials, password rotation, access distribution and reset timing. No demo password is published here.

Private Storage deletion is separate from database transactions. Image replacement/deletion and demo reset durably queue cleanup jobs; the protected admin cleanup endpoint retries pending work, preserves referenced objects and records failed jobs for retry. Configure its server-only key/secret before invoking it through your authorized administrative process. There is no public reset control or automatic cleanup schedule in the repository.

## Architecture and privacy

Next.js App Router, React, strict TypeScript, Tailwind/shadcn primitives, Zod, Lucide, and Supabase Auth/PostgreSQL/private Storage. Server routes compose feature modules; authenticated Server Actions validate mutations against the current owned schema. Proxy session refresh is not the only authorization check: data operations and RLS enforce ownership too.

```text
app/                 Routes, layouts, loading/error boundaries and HTTP handlers
features/            Auth, Collections, Fields, Items and gallery behavior
components/          Shared UI and accessible primitives
lib/                 Supabase clients/types, environment and shared validation
supabase/migrations/ Forward-only schema, RLS, Storage and admin RPC changes
supabase/seed/       Fictional demo fixture builder
supabase/tests/      Local SQL and API verification
scripts/             Admin operator commands
tests/               Unit, component and deferred browser tests
```

The [database design and ERD](docs/database-design.md) describe ownership and stable IDs. Images use a private bucket and owner/Collection/Item-scoped generated paths; delivery checks authorization and uses time-limited access. Do not store signed URLs as permanent data. Deletion is permanent, with no trash or undo.

```text
Auth user ── owns many ── Collections ── contain many ── Items
                             │                         │
                             └── Fields ── Select options
Auth user ── optional one ── Demo seed marker
Collection/Item ── optional references ── Durable Storage cleanup jobs
```

Item custom values reference stable Field/option UUIDs. Cleanup jobs survive Collection/Item deletion with nullable references; deleting database rows does not itself remove private image bytes. Folders are derived views, not persisted entities.

## Known limitations and roadmap

- M7-T02 still needs actual checks at 320, 375, 640, 768, 1024 and 1440 px, keyboard/zoom/device behavior, rendered contrast and layout review. Current axe checks run in jsdom with documented exclusions.
- No hosted demo seed, hosted cross-account verification, production URL or deployment smoke evidence has been recorded. M8-T03 requires explicit deployment authorization.
- Demo resets can interrupt visitors' edits. Shared concurrent edits use last-write-wins rather than optimistic conflict detection.
- Storage cleanup needs an authorized worker invocation; no automatic schedule is configured.
- Search, Library sorting, expanded auth recovery, broader unsaved-navigation protection, image download and cover enhancements remain P1. Sharing, public Collections, nested folders, multiple gallery views, multi-image Items, themes, export and trash remain P2. See [task tracker](docs/tasks.md).

Visual direction comes from [DESIGN.md](DESIGN.md), with [application mapping](docs/visual-direction.md) and [design tokens](docs/design-system.md). Original specifications and approved decisions are listed in [AGENTS.md](AGENTS.md); those planning sources live beside this checkout and are not bundled in a repository clone. No screenshots are provided because browser capture was excluded.
