# M8-T02 release documentation and verification

## Status

**In progress; release readiness is not established.** M8-T01 is complete. Required dependency M7-T02 remains open because actual-browser viewport, keyboard, zoom, device and rendered accessibility evidence has not been collected under the owner's no-browser instruction. Documentation preparation can proceed independently, but it does not waive this dependency. Deployment remains M8-T03 and requires explicit authorization.

## Reproduction scope

The README documents current source behavior, private environment variable names, local/hosted setup boundaries, migrations, commands, architecture/ERD, security, demo operations and P1/P2 limitations. No passwords, populated environment values, public demo credentials, screenshots or production URL are bundled. A small Git attributes rule ensures LF text checkout for reproducible formatter results on Windows.

An isolated source archive of `35f856d` was extracted without `.env` files or `node_modules`. Verification uses Node 24.16.0, pnpm 11.25.0 and Supabase CLI 2.122.0. This task changes documentation and Git text-checkout configuration only. The archive shares the machine's package cache but has a separate dependency tree and build output. The already migrated local Supabase stack is reused for integration checks; no reset of developer data or hosted migration/seed is performed.

The initial offline frozen-lockfile installation failed because package-registry metadata was absent from the cache. Normal online frozen-lockfile installation is used instead; no supply-chain policy or lockfile guard is bypassed.

The initial Windows archive checkout used CRLF and failed Prettier across otherwise unchanged files; Git blobs contain LF. `.gitattributes` now declares `* text=auto eol=lf`. A `checkout-index` probe with `core.autocrlf=true` verifies LF output, and the isolated archive was re-extracted with LF for the formatter/toolchain rerun. There was no application-source rewrite. An initial local-integration escalation was not executed because automatic approval review was at capacity; the same authorized local-only check was later retried through review and passed.

## Evidence ledger

Final executed results are recorded in the M8-T02 tracker row. This ledger must not be treated as blanket success for the exceptions below.

**Results:** online frozen install and supply-chain policy check passed; isolated formatting, ESLint, strict TypeScript, 311 Vitest tests across 45 files, production dependency audit and production build passed. All eleven local SQL suites and the SSR, private Storage, security-session and demo-seed API suites passed from the isolated source tree. Relative documentation link targets and package script references were checked against the repository. The new documents are separately formatted and reviewed in the main worktree.

| Check                                           | Scope                                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Locked dependency installation                  | Isolated archive, separate dependency tree; ordinary online install after incomplete offline cache                    |
| Formatter, lint and strict TypeScript           | Current documentation and isolated source toolchain                                                                   |
| Unit/component tests                            | Full isolated-source Vitest suite; no browser process                                                                 |
| Production build                                | Isolated source, placeholder public configuration sufficient for compilation; no hosted network/data acceptance claim |
| Dependency audit                                | Production dependency metadata; no application credential output                                                      |
| SQL and API suites                              | Reused local stack; rollback-only SQL and disposable local API users                                                  |
| Documentation links, commands and secret review | Relative link targets, package script names, safe environment examples and staged diff inspection                     |

## Pending acceptance and unexecuted operator commands

- Complete M7-T02's [six-width/device checklist](accessibility-audit.md). jsdom axe/token checks do not verify rendered layouts, full WCAG conformance or software-keyboard behavior.
- Browser journey tests (`test:e2e`) remain intentionally unexecuted. No screenshots are available.
- The isolated run verifies compilation and test commands, not interactive `dev`/`start` server behavior or application HTTP journeys. Supabase `start` is documented for contributor setup; this run reused the already running stack instead.
- Clean-database bootstrap/reset is documented but not rerun against the existing developer stack because it would delete data. Local integration checks use the migrated stack; a truly fresh database initialization still needs an isolated disposable stack or operator evidence.
- Hosted project migration, Auth redirect setup, actual demo account seeding/password rotation and hosted two-account testing remain operator work. [Demo instructions](demo-operations.md) explicitly separate seed/reset from ordinary application startup.
- No production deployment or smoke test is authorized or performed. A successful local build is not production acceptance.
- Administrative seed/reset and Storage cleanup commands must not be run against real user data merely to validate documentation. Their local disposable-fixture evidence is in M8-T01/M7-T03.

Do not mark M8-T02 Complete until its dependencies and remaining release acceptance have been resolved with recorded evidence or explicit approved scope changes. No exception here silently changes the approved product requirements.
