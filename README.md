# collecto

Collecto is a private personal collection library for organizing books, movies, music, collectibles, meals, travel memories, favorites, and custom collections. Each collection has its own schema, private items, optional images, virtual folders, and configurable gallery.

[GitHub repository](https://github.com/gincole/collecto)

## What the application does

- Provides email and password authentication with owner-scoped private data.
- Creates collections from eight presets or a blank schema.
- Supports ordered custom fields for Text, Number, Date, Rating, Select, and URL values.
- Manages item creation, editing, details, permanent deletion, and one optional private image up to 5 MB.
- Derives virtual folders from Select options without storing a separate folder entity.
- Saves one gallery configuration per collection, including columns, aspect ratio, image fit, visible fields, spacing, and sorting.
- Lets collection owners rename collections, edit their schemas, reorder fields and options, and review destructive changes before confirming them.
- Includes fictional demo data and an admin-only reset workflow for a shared demonstration account.

## Tech stack

| Area              | Technology                                           |
| ----------------- | ---------------------------------------------------- |
| Web application   | Next.js App Router, React, TypeScript                |
| Styling and UI    | Tailwind CSS, shadcn/ui patterns, Radix UI, Lucide   |
| Validation        | Zod                                                  |
| Authentication    | Supabase Auth with cookie-based SSR sessions         |
| Data              | Supabase PostgreSQL with Row Level Security          |
| Images            | Supabase private Storage and Sharp validation        |
| Testing           | Vitest, Testing Library, Playwright, pgTAP, axe-core |
| Deployment target | Vercel and hosted Supabase                           |

The exact runtime and package versions are pinned in [`package.json`](package.json) and `pnpm-lock.yaml`.

## Architecture

Collecto uses a feature-based, server-first architecture. App Router files compose pages and HTTP boundaries, while each domain feature owns its validation, queries, mutations, mapping, and interactive UI.

```text
app/                 Routes, layouts, loading and error boundaries, API handlers
features/            Auth, Collections, Fields, Items, Gallery domain modules
components/          Shared application components and UI primitives
lib/                 Environment validation, Supabase clients, shared utilities
supabase/migrations/ Forward-only schema, RLS, Storage, and RPC migrations
supabase/seed/       Fictional demo fixture builder
supabase/tests/      Database, authorization, Storage, and session integration tests
tests/               Unit, component, accessibility, and end-to-end tests
scripts/             Protected administrative commands
```

The main request path is:

```text
Browser
  -> Next.js Server Component, Server Action, or Route Handler
  -> Zod input validation and authenticated user lookup
  -> Feature service and gateway
  -> Supabase PostgreSQL or private Storage
  -> Row Level Security and database constraints
```

Routes remain thin, private data is fetched on the server by default, and Client Components are limited to interactions that require browser state or event handlers.

## Data model

```text
Auth user
  └── Collections
        ├── Field definitions
        │     └── Select options
        └── Items
              └── optional private image path

Collection and Item operations
  └── durable Storage cleanup jobs
```

Custom item values are stored as JSONB keyed by stable field UUIDs. Select values store option UUIDs instead of labels, so renaming a field or option does not break existing data. Presets live in application code and are copied into independently editable rows when a collection is created.

See [`docs/database-design.md`](docs/database-design.md) for the schema, constraints, indexes, RLS matrix, and cleanup model.

## Security model

Security is enforced at more than one boundary:

- Server mutations derive the owner from the authenticated session and validate every untrusted input with Zod.
- PostgreSQL Row Level Security restricts collections and all child records through collection ownership.
- Direct requests for another owner's IDs do not reveal whether those records exist.
- Images are stored in a private bucket under generated owner, collection, and item paths.
- Image delivery checks ownership before returning short-lived access.
- Service-role credentials and cleanup secrets are server-only and never use a `NEXT_PUBLIC_` prefix.
- Permanent deletion records private objects in a durable cleanup queue because database transactions cannot atomically delete Storage objects.
- Cleanup workers claim jobs atomically, retry failures, and reclaim jobs left by stale workers.

Never commit `.env`, `.env.local`, passwords, private keys, access tokens, service-role credentials, signed URLs, or populated CLI output.

## Requirements

- Node.js 22.18 or newer
- pnpm 11.25.0 through Corepack
- A Supabase project, or Docker and Supabase CLI 2.122.0 for local integration testing

## Local setup

Install the locked dependencies and create a private environment file:

```powershell
corepack pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

Set the following browser-safe variables in `.env.local`:

| Variable                               | Purpose                                             |
| -------------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project API URL                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key from the same Supabase project     |
| `NEXT_PUBLIC_SITE_URL`                 | Application origin, such as `http://127.0.0.1:3000` |

Start the application:

```powershell
corepack pnpm dev
```

Open `http://127.0.0.1:3000`. Use one origin consistently in the application configuration and Supabase Auth redirect settings.

### Local Supabase

Start the checked-in local stack:

```powershell
corepack pnpm dlx supabase@2.122.0 start
corepack pnpm dlx supabase@2.122.0 status
```

The local configuration uses API port `55321`, database port `55322`, and Studio port `55323` unless the CLI reports otherwise.

To recreate a disposable local database from the migration history:

```powershell
corepack pnpm dlx supabase@2.122.0 db reset --local
```

This command permanently deletes data in the local database. Do not run it against a database that contains data you need.

### Optional server-only variables

| Variable                 | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `SUPABASE_SECRET_KEY`    | Demo administration and Storage cleanup                               |
| `STORAGE_CLEANUP_SECRET` | Protects `POST /api/admin/storage-cleanup`                            |
| `DEMO_USER_EMAIL`        | Identifies the account that should display the shared-demo notice     |
| `DEMO_USER_ID`           | Confirms the exact account targeted by demo seed and reset operations |

The administrative demo workflow is documented in [`docs/demo-operations.md`](docs/demo-operations.md).

## Verification

Run the source verification checks:

```powershell
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test --maxWorkers=1
corepack pnpm audit --prod
corepack pnpm build
```

With the disposable local Supabase stack running, the repository also provides integration suites for the database, SSR sessions, private Storage, multi-session security, and demo seed behavior:

```powershell
corepack pnpm test:database
corepack pnpm test:auth:ssr
corepack pnpm test:storage
corepack pnpm test:security:sessions
corepack pnpm test:demo
```

End-to-end browser journeys are available through:

```powershell
corepack pnpm test:e2e
```

Integration tests reject non-loopback Supabase URLs, create disposable users, and clean up their fixtures. Keep all credentials and CLI status output private.

## Deployment

The production target is Vercel with a hosted Supabase project.

1. Apply every migration under `supabase/migrations` to the hosted project in filename order.
2. Configure the production origin and `/auth/callback` URL in Supabase Auth.
3. Add the required public and server-only environment variables to the deployment platform.
4. Use `corepack pnpm install --frozen-lockfile` as the install command.
5. Use `pnpm verify:deployment` as the build command.
6. Run authentication, ownership, image, cleanup, responsive-layout, and mobile smoke tests against the deployed application.

A public production URL is intentionally not listed until the deployment has been smoke-tested.

## Design and accessibility

The interface uses a restrained zinc palette, DM Sans typography, border-led surfaces, and responsive layouts designed for small phones through desktop screens. Interactive controls support visible focus, keyboard operation, reduced motion, non-drag reorder alternatives, and practical touch targets.

- [`DESIGN.md`](DESIGN.md) records the visual language.
- [`docs/design-system.md`](docs/design-system.md) defines reusable tokens and component rules.
- [`docs/visual-direction.md`](docs/visual-direction.md) maps those rules to application surfaces.

Automated accessibility tests support development, but they do not replace manual keyboard, zoom, screen-reader, contrast, and real-device testing.

## Current limitations

- Shared demo sessions use disclosed last-write-wins behavior rather than optimistic conflict detection.
- Storage cleanup requires an authorized worker invocation; the repository does not configure a scheduler.
- Search, library sorting, password recovery UI, broader unsaved-navigation prompts, image download, and custom collection covers are outside the current release.
- Sharing, public collections, collaboration, nested folders, multiple saved gallery views, multiple images per item, export, themes, and trash are not implemented.

## License

No open-source license has been added. Unless a license is added later, the source remains under the repository owner's default copyright.
