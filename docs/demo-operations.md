# Demo data and admin reset

The demo seed supplies fictional **My Books**, **Food Memories**, and **My Collectibles**, with six Items each. They use Text, Number, Date, Rating and Select values, optional empty membership, ordered Fields and options, and three gallery ratios. No image files are seeded; the existing missing-image treatment is used. The seed contains no account password or private user content.

## One-time setup

1. Apply `20261030180000_admin_demo_reset.sql` through the normal migration workflow to the intended database. This adds an RLS-protected admin marker and a service-role-only seed/reset function; it does not seed or delete data by itself.
2. In Supabase Auth, ensure the approved demo account exists. Its configured email is `test@gmail.com`. Copy its UUID from Auth > Users. The seed command never creates an account or changes its password.
3. In ignored `.env.local` (or `.env`), set `NEXT_PUBLIC_SUPABASE_URL`, server-only `SUPABASE_SECRET_KEY`, `DEMO_USER_EMAIL`, and `DEMO_USER_ID`. The CLI loads `.env` then `.env.local`; existing process variables take precedence. Never prefix the admin key with `NEXT_PUBLIC_` or commit populated files. The application uses `DEMO_USER_EMAIL` only on the server to show the shared-demo disclosure.
4. Confirm the target Supabase project, email and UUID before running. Both CLI and database verify the account ID and email pair. Validate the workflow with disposable local accounts before operating on a hosted project.

The CLI requires Node 22.18+ (or Node 24+) for native TypeScript fixture loading. No new package is required.

## Seed without overwriting edits

```powershell
corepack pnpm demo:seed
```

An unseeded, empty demo account receives the fixtures atomically. A marker makes subsequent seed commands no-ops, preserving visitor edits. An account that already has Collections but has never been seeded is rejected; use the explicit reset only after confirming its target. Seed operations serialize per owner to prevent duplicate initialization.

## Reset the configured demo account

Reset permanently replaces **all Collections and Items belonging to the configured demo user**, including visitor-created data. It preserves the Auth account, password, active sessions and every other owner's data. There is no undo.

```powershell
corepack pnpm demo:seed --reset --confirm-owner=<DEMO_USER_ID>
```

Replace the placeholder with the verified UUID. A missing or different confirmation is rejected. Old private image paths are durably queued for the existing protected Storage-cleanup worker before deletion; run the admin cleanup workflow separately to remove bytes. Reset locks the owner, Collections and Items before taking the cleanup snapshot, so a concurrent image update cannot leave a newly attached object unqueued. Database reset/fixture insertion is one transaction: an invalid fixture or failed insert rolls back the deletion and queued jobs. There is no reset page, public button, or new HTTP endpoint. Anonymous/authenticated roles cannot execute the RPC or access its marker table.

The shared demo notice explains that visitors share writable data, other visitors can see/change it, the last save wins, fictional information should be used, and data may be reset. Rotating the demo password, distributing demo access, scheduling resets and choosing when to reset are the user's operational responsibilities. Do not put the password into source, commands captured in logs, seed files, screenshots or public documentation.

## Verification

`corepack pnpm test:demo` uses the loopback-only local Supabase test configuration. It creates random temporary users, seeds twice, checks three Collections/six Items each, verifies two independent sessions observe edits, checks denied public RPC access and owner confirmation, proves failed/malformed reset rollback, coordinates a separate Item image writer with reset, compares reset counts/content structure, verifies durable cleanup of the writer's newly committed path and another owner's sentinel, then removes its temporary cleanup jobs/users. It does not touch the real demo account.

The database and unit suites cover RLS, Field types, image cleanup, and last-write-wins recovery. Hosted execution must be performed deliberately by an authorized operator after confirming the target project and account.
