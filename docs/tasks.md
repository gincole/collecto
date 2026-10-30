# Task Tracker

## Status rules

Allowed statuses: `Not started`, `In progress`, `Blocked`, `Complete`, `Deferred P1`, and `Deferred P2`.

For every task, update status, verification evidence, and actual commit hash in the same commit as the task implementation. Because a commit cannot contain its own stable SHA, `SELF` in the Actual commit column means the commit containing that row; report the resolved SHA immediately after committing. A task is `Complete` only when its acceptance criteria pass and its commit exists. After reporting the hash, stop for approval.

Critical-path marker `Yes` means delay directly threatens the two-day MVP or production delivery.

## P0 milestones and tasks

| ID      | Milestone      | Task                                                        | Depends on              | Critical | Planned commit            | Status      | Actual commit | Verification evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | -------------- | ----------------------------------------------------------- | ----------------------- | -------- | ------------------------- | ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0-T01  | Foundation     | Initialize App Router and toolchain                         | Plan approval           | Yes      | `chore(app)`              | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 3 Vitest tests, and Next.js production build pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| M0-T02  | Foundation     | Establish feature boundaries and shared primitives          | M0-T01                  | Yes      | `chore(architecture)`     | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 13 Vitest tests, dependency audit, responsive Playwright checks at 320/1440 px, and production build pass.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| M0-T03  | Foundation     | Implement design tokens and shell styles                    | M0-T01                  | No       | `feat(design-system)`     | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 19 Vitest tests, dependency audit, AA/non-text contrast audit, browser checks at all 6 widths, focus/touch/Thai/reduced-motion checks, verified Next.js client hydration origin, and production build pass.                                                                                                                                                                                                                                                                                                                         |
| M1-T01  | Database       | Create schema and generated types                           | M0-T01                  | Yes      | `feat(database)`          | Complete    | `3033fb4`     | Prettier, ESLint, strict TypeScript, 25 Vitest tests, dependency audit, clean local Supabase reset, pgTAP schema tests, migration contract review, and production build pass. Connected verification awaits Supabase values.                                                                                                                                                                                                                                                                                                                                             |
| M1-T02  | Database       | Add RLS and ownership tests                                 | M1-T01                  | Yes      | `feat(security)`          | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 25 Vitest tests, dependency audit, clean local reset, 2 pgTAP suites, database lint, two-owner CRUD/direct-ID isolation, anonymous denial, cleanup-job denial, and production build pass. Connected verification awaits Supabase values.                                                                                                                                                                                                                                                                                            |
| M1-T03  | Database       | Configure private image Storage policies                    | M1-T02                  | Yes      | `feat(storage)`           | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 34 Vitest tests, dependency audit, clean local reset, 3 pgTAP suites, database lint, private bucket/path/ownership/anonymous-access checks, server-only authorization and fixed-TTL signing helper tests, local Storage API upload/sign/isolation/delete checks, and production build pass. Connected verification awaits Supabase values.                                                                                                                                                                                          |
| M2-T01  | Authentication | Add SSR clients and session refresh                         | M0-T01, M1-T02          | Yes      | `feat(auth)`              | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 53 Vitest tests, dependency audit, local Supabase SSR sign-in/refresh/subsequent-request integration, protected-route and safe-return-URL checks, browser bundle secret scan, and production build pass.                                                                                                                                                                                                                                                                                                                            |
| M2-T02  | Authentication | Implement register login logout and account menu            | M2-T01, M0-T03          | Yes      | `feat(auth)`              | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 71 Vitest tests, dependency audit, confirmation callback checks, 6 local Supabase Playwright tests covering generic errors/register/session refresh/two-session local logout/login, confirmation errors, keyboard flow, and 320/375/1440 px overflow, configured production build, and browser secret scan pass.                                                                                                                                                                                                                    |
| M3-T01  | Collections    | Define presets contracts and server operations              | M1-T02, M2-T02          | Yes      | `feat(collections)`       | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 93 Vitest tests, dependency audit, configured production build, clean local Supabase reset, database lint, and 4 pgTAP suites pass. Preset/schema contracts, Server Action validation, typed ordered row mapping, atomic rollback, owner-scoped idempotency, malformed gallery rejection, and two-owner non-disclosure are covered.                                                                                                                                                                                                 |
| M3-T02  | Collections    | Implement Library and Create wizard                         | M3-T01, M0-T02, M0-T03  | Yes      | `feat(collections)`       | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 105 Vitest tests, dependency audit, production build, and 1 local Supabase Playwright journey pass covering preset/Blank persistence, no pre-submit write, axe WCAG, touch targets, responsive Library/wizard behavior, and 320/375/640/768/1024/1440 px overflow.                                                                                                                                                                                                                                                                  |
| M3-T03  | Collections    | Implement identity settings and deletion                    | M3-T02                  | No       | `feat(collections)`       | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 121 Vitest tests, dependency audit, configured build, clean Supabase reset, 5 pgTAP suites, and database lint pass. Identity update/delete, ownership, exact counts, confirmation recovery, cleanup retry, and stale-worker recovery are covered.                                                                                                                                                                                                                                                                                   |
| M4-T01  | Items          | Implement schema-driven CRUD without images                 | M3-T01, M1-T02          | Yes      | `feat(items)`             | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 132 Vitest tests, dependency audit, configured production build, clean Supabase reset, 6 pgTAP suites, database lint, and 1 local Supabase Playwright journey pass. All six field types, atomic current-schema validation, owner-scoped direct IDs, persistence/reload, create/edit, axe WCAG checks, first-error focus, duplicate-submit protection, and 320/1440 px overflow are covered.                                                                                                                                         |
| M4-T02  | Items          | Add private single-image lifecycle                          | M4-T01, M1-T03          | Yes      | `feat(images)`            | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 143 Vitest tests, dependency audit, configured production build, clean Supabase reset, 7 pgTAP suites (13 assertions), database lint, Storage API integration, and 1 local Supabase Playwright journey pass. Server-side MIME/size/decodability checks, generated private paths, upload/replace/remove rollback and durable cleanup, ownership isolation, short-lived signed viewing, filename stripping, accessibility, and 320/1440 px behavior are covered.                                                                      |
| M4-T03  | Items          | Implement Item Details and deletion                         | M4-T02                  | No       | `feat(items)`             | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 148 Vitest tests, dependency audit, configured production build, clean Supabase reset, 8 pgTAP suites (17 assertions), public-schema database lint, and 1 local Supabase Playwright journey pass. Dedicated owner-scoped Details, current Select labels, ordered localized metadata, accurate Ratings, image fallback/full-size viewing, edit return, keyboard confirmation, atomic cleanup scheduling, delete return, and 320/375/640/768/1024/1440 px behavior are covered.                                                       |
| M5-T01  | Fields         | Implement Field and Option mutations                        | M4-T01                  | Yes      | `feat(fields)`            | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 168 Vitest tests, dependency audit, configured production build, clean Supabase reset, 9 pgTAP suites (39 assertions), and public-schema database lint pass. Owner-scoped Field/Option create, stable-ID rename/reorder, immutable types/parents, case-insensitive uniqueness, required enforcement, exact impact counts, serialized Item writes, atomic JSONB/gallery cleanup, Uncategorized option cleanup, contiguous ordering, and direct-ID denial are covered. Browser tests were intentionally not run per user instruction. |
| M5-T02  | Fields         | Implement Field and Option editors                          | M5-T01, M3-T03          | Yes      | `feat(fields)`            | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 179 Vitest tests, dependency audit, configured production build, and focused code review pass. Component tests cover built-in/custom distinction, all Field and Select Option mutations, stable-ID payloads, exact destructive impact, keyboard/touch reorder controls, conflict recovery, partial Select completion, focus restoration, pending-dismissal guards, mobile full-screen editor classes, and unit-level WCAG checks. Browser tests were intentionally not run per user instruction.                                    |
| M6-T01  | Gallery        | Implement responsive gallery and sorting                    | M4-T03, M5-T01          | Yes      | `feat(gallery)`           | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 195 Vitest tests, dependency audit, configured production build, and focused code review pass. Gallery tests cover deterministic locale-aware sorting, all five column preferences and ratios, horizontal single-column cards, cover/contain, details OFF, ordered stable-ID values, missing-image recovery, spacing, configuration rejection, Collection actions, empty/loading/retry states, and unit accessibility. Browser and visual viewport checks intentionally skipped per user instruction.                               |
| M6-T02  | Gallery        | Implement Gallery Settings draft workflow                   | M6-T01                  | Yes      | `feat(gallery)`           | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 209 Vitest tests, dependency audit, configured production build, focused review, and 10 local pgTAP assertions pass. Covers draft-only preview, Save/Cancel, dirty Escape/discard, pending guards, field selection cap/order, details OFF preservation, stale-field sanitization, safe error recovery, authenticated RPC wiring, owner isolation, and atomic current-schema validation. Desktop right-sheet/mobile full-screen composition is implemented; browser and viewport tests skipped per user instruction.                 |
| M6-T03  | Browse         | Implement Select virtual folders and URL state              | M6-T02, M5-T01          | Yes      | `feat(browse)`            | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 222 Vitest tests, audit, configured build, and review pass. Covers Select-only navigation, zero-count options, Uncategorized, stable-ID membership, shared config, empty folders, URL reconstruction, stale/foreign/repeated IDs, ownership-before-redirect, and unit accessibility. An unchanged Field-editor timing assertion failed in the concurrent run; full serial rerun passed. Browser/history/viewport tests skipped per user instruction.                                                                                |
| M7-T01  | Quality        | Complete application states and feedback                    | M2-T02–M6-T03           | Yes      | `fix(ux)`                 | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 234 Vitest tests, dependency audit, configured production build, and focused review pass. State audit covers dismissible success/error notifications, consumed redirect notices, request recovery, destructive pending guards, aligned form widths/type tokens, non-shrinking controls, back navigation, route skeletons, unavailable/retry states, and image retry. See docs/state-audit.md. Browser/viewport checks skipped per user instruction; creation-time preset editing is tracked separately in M7-T01A.                  |
| M7-T01A | Quality        | Customize preset Fields before final Create                 | M7-T01                  | No       | `feat(collections)`       | Complete    | SELF          | 280 Vitest tests across 41 files pass, plus focused heading/focus regressions, formatter, ESLint, strict TypeScript, dependency audit, configured production build and focused review. Two rollback-only local pgTAP suites pass 23 assertions covering customized persistence, atomic rollback, idempotency, ownership and persisted-type immutability. Covers draft editing, preset/Blank switching, Select options, validation, pending guards and failure retention. No migration, browser tests or hosted writes.                                                   |
| M7-T02  | Quality        | Accessibility and responsive conformance                    | M7-T01                  | Yes      | `fix(accessibility)`      | In progress | SELF          | 291 Vitest tests across 42 files, formatter, ESLint, strict TypeScript, dependency audit, configured build and review pass. Shared skip navigation, bounded dialogs, safe-area positioning, non-overlapping actions, narrow controls and label-in-name fixes implemented with component axe coverage. Six-width/device, zoom, keyboard and rendered checks remain pending under the user no-browser instruction. See docs/accessibility-audit.md; task remains open.                                                                                                     |
| M7-T02A | Quality        | Standardize destructive actions and notification UX         | M7-T01                  | No       | `fix(ux)`                 | Complete    | SELF          | Prettier, ESLint, strict TypeScript, 245 Vitest tests, audit, configured build, and focused review pass. Shared Delete triggers/menu links and confirmations preserve deletion guards. Timed top toasts pause on interaction; persistent inline errors remain. Custom validation replaces native popovers in every form. Timer, focus, validation, deletion, and recovery regressions pass. Browser tests skipped per user instruction. See design-system and state-audit notes.                                                                                         |
| M7-T02B | Quality        | Complete immediate loading feedback                         | M7-T02A                 | No       | `fix(ux)`                 | Complete    | SELF          | 258 Vitest tests across 39 files pass; lint, strict TypeScript, dependency audit, configured production build, scoped formatting and focused review pass. Covers immediate Browse views, shared Link progress, root/image skeletons, retries, Field/Option pending states and wizard cancellation. Fixed a timing-sensitive impact-check assertion. Browser checks excluded. Repository-wide formatting is blocked only by unrelated untracked DESIGN.md, left untouched. See docs/state-audit.md.                                                                       |
| M7-T02C | Quality        | Apply DESIGN.md across the application                      | M7-T02B                 | No       | `style(ui)`               | Complete    | SELF          | 259 Vitest tests across 39 files pass, including token/contrast and responsive gallery contracts; formatting, ESLint, strict TypeScript, dependency audit, configured production build, generated CSS inspection and focused review pass. Applies Awesomic tokens/type/geometry across all existing screens and shared states; preserves gallery columns 1–5, form semantics and safety states. Source DESIGN.md and authority mapping included. No browser or hosted checks per user instruction; full M7-T02 conformance remains open.                                 |
| M7-T02D | Quality        | Match Collection and folder card hover motion               | M7-T02C                 | No       | `fix(ui)`                 | Complete    | SELF          | 32 focused Library/Browse tests, scoped formatting, lint, TypeScript and configured production build pass. Shared 150 ms easing/lift animates Tailwind CSS translate with reduced-motion suppression; regression and generated CSS verified. No browser tests. Concurrent branding edits excluded.                                                                                                                                                                                                                                                                       |
| M7-T02E | Quality        | Consolidate modal flows and shared controls                 | M7-T02D                 | No       | `fix(ui)`                 | Complete    | SELF          | 319 Vitest tests/46 files, formatter, ESLint, strict TypeScript, dependency audit, production build and focused review pass. Shared vertical modals/fixed footers, direct and intercepted navigation, Back/focus/dirty guards, shared menus/Select and skeletons. Browser checks excluded; broader M7-T02 remains open. See docs/modal-consistency.md.                                                                                                                                                                                                                   |
| M7-T02F | Quality        | Restore strict route matching for authentication            | M7-T02E                 | No       | `fix(routing)`            | Complete    | SELF          | 320 tests/47 files pass; formatter, lint, TypeScript and configured production build pass. Installed Next dev validator regression fails before fix and passes afterward; login/register HTTP 200 on existing dev server. Modal clearing scoped to Collections and Library; strict matching retained. No browser checks.                                                                                                                                                                                                                                                 |
| M7-T02G | Quality        | Correct immediate local modal behavior                      | M7-T02F                 | No       | `fix(ui)`                 | Complete    | SELF          | 328 tests/49 files, formatter, lint, TypeScript, production build and independent review pass. Home Back removed; eager local dialogs keep URL, use X/Escape/backdrop, fixed footer and dirty/pending/focus guards; create refreshes in place. Exact preloaded count aggregates covered by SDK/mapping tests. Local Supabase unavailable for live query check; no browser/hosted writes. See docs/modal-consistency.md.                                                                                                                                                  |
| M7-T02H | Quality        | Double page bottom spacing and coordinate dropdowns         | M7-T02G                 | No       | `fix(ui)`                 | Complete    | SELF          | 334 tests/50 files, formatter, lint, strict TypeScript, dependency audit, production build, emitted CSS inspection and independent review pass. Shared mobile/desktop bottom padding doubled; one-click nonmodal Select/menu switching, accessible focus/labels/typeahead, inert animated exits and reduced motion. No browser checks. See docs/dropdown-spacing.md.                                                                                                                                                                                                     |
| M7-T02I | Quality        | Commit user-authored collecto branding                      | M7-T02H                 | No       | `chore(branding)`         | Complete    | SELF          | Commits the user-approved pending naming edits only: header, auth pages, metadata, README, project instructions, design-system text and matching auth assertion use collecto. Acceptance verified by diff review, 9 focused auth tests and repository formatting. Prior M7-T02H full-suite/build checks used these same working-tree edits. No browser tests or push.                                                                                                                                                                                                    |
| M7-T03  | Quality        | Security and failure-path suite                             | M7-T01, M1-T03          | No       | `test(security)`          | Complete    | SELF          | 307 Vitest tests across 44 files, ten local SQL suites, SSR cookies, private Storage API and new two-session security API pass; formatter, ESLint, strict TypeScript, dependency audit, configured build and review pass. Covers concurrent idempotency, owner isolation, last-write-wins, stale recovery, logout, cleanup failures and sanitized logs/errors. Strict TAP runner and loopback-only disposable API fixtures. See docs/security-verification.md. No browser/hosted checks; M7-T02 and seeded-demo work remain separate.                                    |
| M8-T01  | Delivery       | Add demo seed and protected reset                           | M6-T03, M7-T03          | Yes      | `feat(demo)`              | Complete    | SELF          | 311 Vitest tests across 45 files, eleven local SQL suites, disposable-account demo API, formatter, lint, TypeScript, audit, configured build and review pass. Verifies 3 Collections/18 Items, idempotent seed, admin-only confirmed reset, two sessions, rollback, concurrent image cleanup and owner isolation. Shared-demo notice and operator guide included. Migration tested locally only; no hosted seed or browser tests.                                                                                                                                        |
| M8-T02  | Delivery       | Complete README and release verification                    | M8-T01, M7-T02          | Yes      | `docs(release)`           | In progress | SELF          | README/setup/security/ERD/limits and release evidence prepared. Isolated frozen install, formatting, lint, TypeScript, 311 tests/45 files, audit/build, eleven local SQL and four API suites pass. Windows LF checkout fix verified; links reviewed. M7-T02/browser acceptance, clean-database bootstrap and hosted/operator checks remain open. No deployment; see docs/release-verification.md.                                                                                                                                                                        |
| M8-T03A | Deployment     | Exclude generated deployment artifacts from source checks   | Reported M8-T03 failure | Yes      | `fix(ci)`                 | Complete    | SELF          | Formatter exit 2 reproduced before fix. Frozen install into isolated source copy, placeholder public env and malformed cloud cache fixtures: full verify:deployment passes, including 336 tests/51 files and build. Audit, Git ignore probes and focused review pass. Local Windows evidence; hosted redeploy/mobile acceptance pending. See docs/deployment-build.md.                                                                                                                                                                                                   |
| M8-T03B | Deployment     | Isolate the component test runtime from production NODE_ENV | M8-T03A                 | Yes      | `fix(ci)`                 | Complete    | SELF          | Reproduced with parent NODE_ENV=production; worker-only test env fixes real React rendering. Isolated full verify:deployment under production/CI/VERCEL flags passes formatting, lint, types, 337 tests/52 files and production build; parent remains production. Scoped cold ESLint integration timeout and independent review pass. Hosted retry pending; see docs/deployment-build.md.                                                                                                                                                                                |
| M8-T03  | Deployment     | Configure Vercel and smoke-test production                  | M8-T02, authorization   | Yes      | `chore(deploy)` if needed | In progress | SELF          | User attempted deployment of a39547b; blocked by formatter scanning generated Vercel/pnpm artifacts. M8-T03A fixes formatting; the next attempt reached tests and exposed production NODE_ENV (M8-T03B). No successful production/mobile acceptance recorded.                                                                                                                                                                                                                                                                                                            |

## Manual-test feedback follow-up

Reported by the user on 30 October 2026. The M7-T01 state audit and implementation are documented in `docs/state-audit.md`; full visual conformance remains M7-T02.

- Preset customization before Create: implemented in M7-T01A with local drafts, server validation and atomic persistence; persisted custom Field types remain immutable.
- Clipped Delete action: shared buttons no longer shrink and the Settings description wraps. Browser confirmation remains excluded.
- Missing Settings back action: implemented, with the same shared back-link treatment on Item forms/details.
- Feedback and smoothness: shared success/error presentation, navigation notices, route skeletons, retries, and pending guards are implemented. The typography reset is corrected and form widths are tokenized. Further visual, spacing, and responsive conformance work remains M7-T02.
- M7-T02C reserves the scrollbar gutter to address centered-header movement; manual browser confirmation remains pending. M7-T02B addresses immediate All/Select/folder feedback; browser timing and full responsive conformance remain unverified.
- M7-T02A: user-requested delete consistency and transient top toasts replace the earlier permanent banners. Native form-validation popovers are replaced with custom inline errors. This does not complete the broader M7-T02 audit.

## Deferred P1 tasks

| ID     | Task                                           | Status      | Actual commit |
| ------ | ---------------------------------------------- | ----------- | ------------- |
| P1-T01 | Library and Item search                        | Deferred P1 | —             |
| P1-T02 | Library sorting                                | Deferred P1 | —             |
| P1-T03 | Forgot-password and recovery UI                | Deferred P1 | —             |
| P1-T04 | Display name profile                           | Deferred P1 | —             |
| P1-T05 | Original-image download                        | Deferred P1 | —             |
| P1-T06 | Breadcrumbs and broad dirty-navigation prompts | Deferred P1 | —             |
| P1-T07 | Enhanced Collection covers and illustrations   | Deferred P1 | —             |

## Deferred P2 task groups

| ID     | Task group                                     | Status      |
| ------ | ---------------------------------------------- | ----------- |
| P2-T01 | Public Collections sharing and collaboration   | Deferred P2 |
| P2-T02 | Nested folders and advanced filtering          | Deferred P2 |
| P2-T03 | Multiple saved gallery views                   | Deferred P2 |
| P2-T04 | Multi-image Items duplicate and move           | Deferred P2 |
| P2-T05 | Collection duplicate and pin                   | Deferred P2 |
| P2-T06 | Theme avatar export account deletion and trash | Deferred P2 |
| P2-T07 | Google OAuth                                   | Deferred P2 |

## Two-day checkpoint record

| Checkpoint              | Required completed tasks | Status      | Notes                                                                       |
| ----------------------- | ------------------------ | ----------- | --------------------------------------------------------------------------- |
| Day 1 foundation        | M0-T01 through M2-T02    | Not started | Supabase values are required before connected auth/RLS checks.              |
| Day 1 vertical slice    | M3-T01, M3-T02, M4-T01   | Not started | Must demonstrate persisted Collection and Item without weakening ownership. |
| Day 2 feature complete  | M4-T02 through M6-T03    | Not started | Must include images, fields, gallery settings, and Browse.                  |
| Day 2 release candidate | M7-T01 through M8-T02    | Not started | All local checks and acceptance evidence complete.                          |
| Deployment              | M8-T03                   | Not started | Vercel is intentionally deferred until authorized deployment.               |

## M7-T02J: Add Field inside Collection Settings

- Status: Complete; dependencies M7-T02G and M7-T02I are complete.
- Scope and acceptance: see M7-T02J in `docs/implementation-plan.md`; user-approved
  replacement of the stacked Add Field dialog with a screen in the same modal.
- Verification: focused component checks passed (22 tests across 3 files);
  `corepack pnpm verify:deployment` passed formatting, lint, strict TypeScript,
  all 340 tests across 53 files, and the production build. Independent review
  found no actionable defects. Staged diff and secret inspection passed.
  No browser testing, deployment or push.
- Commit: SELF (this commit).

## M7-T02K: Repair custom Field reordering

- Status: Complete; dependencies M5-T02 and M7-T02J are complete.
- Scope/acceptance: see M7-T02K in `docs/implementation-plan.md`.
- Diagnosis: the list rendered only server props after a save, relying on route
  refresh for movement; the displayed grip had no drag handlers.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 345 tests across 53 files and the production build.
  Independent review found no actionable defects. Staged diff and secret checks
  passed. No browser testing or hosted database writes.
- Commit: SELF (this commit).

## M7-T02L: Refine modal composition and preset alignment

- Status: Complete; dependencies M7-T02J and M7-T02K are complete.
- Scope/acceptance: see M7-T02L in `docs/implementation-plan.md` and the approved
  modal refinement in `docs/visual-direction.md`.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 347 tests across 53 files and the production build.
  Compiled CSS confirms scoped panel/heading rules; independent review passed
  after aligning option/gallery section headings. Staged diff and secret checks
  passed. Browser/device visual acceptance remains excluded at user request.
- Commit: SELF (this commit).

## M7-T02M: Apply explicit New Collection modal layouts

- Status: Complete; dependency M7-T02L is complete.
- Scope/acceptance: see M7-T02M in `docs/implementation-plan.md`.
- Changes: both wizard steps and schema groups now choose modal classes directly;
  compact centered cards/actions and inline X replace the empty shell title strip.
- Verification: 24 focused wizard/local-dialog tests passed; full deployment
  gate passed formatting, lint, strict TypeScript, all 347 tests across 53 files
  and the production build. Source/style inspection and independent review passed.
  Staged diff/secret checks passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02N: Smooth, continuously editable custom Field ordering

- Status: Complete; dependencies M7-T02K and M7-T02M are complete.
- Scope/acceptance/research: see M7-T02N in `docs/implementation-plan.md`.
- Changes: sortable full-row overlay and movement transitions; serial/coalescing
  background saves preserve usable reorder controls and the latest intended order.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 355 tests across 54 files and the production build.
  Pointer/keyboard sensors, queue races/rollback, deferred refresh during drag
  and reduced-motion changes are covered. Production dependency audit is clean;
  independent review passed after fixing the deferred-refresh race and naming
  drag announcements. Staged diff/secret checks passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02O: Protect Field actions and animate arrow swaps

- Status: Complete; dependency M7-T02N is complete.
- Scope/acceptance/research: see M7-T02O in `docs/implementation-plan.md`.
- Changes: stable arrow/Edit/Delete group, ellipsis names, short Edit, inline
  Required, parenthesized Select counts and centralized emoji type labels;
  always-measured sortable rows enable the first arrow swap animation.
- Verification: formatting, lint, strict TypeScript, all 358 tests across 54
  files and the production build passed. First-arrow transform/transition and
  reduced-motion regressions passed; independent review found no issues.
  Staged diff/secret inspection passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02P: Align built-in rows with custom Fields

- Status: Complete; dependency M7-T02O is complete.
- Scope/acceptance: see M7-T02P in `docs/implementation-plan.md`.
- Changes: remove the repeated Collection name; reuse Field rows for built-in
  Title/Description with lock controls and disabled actions; retain emoji types.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 358 tests across 54 files and the production build.
  Component/axe checks cover disabled built-in controls, shared emoji metadata
  and subtitle removal; independent review and staged diff/secret checks passed.
  No browser testing.
- Commit: SELF (this commit).

## M7-T02Q: Use Lucide icons for every Field type

- Status: Complete; dependency M7-T02P is complete.
- Scope/acceptance: see M7-T02Q in `docs/implementation-plan.md`; the latest user
  clarification supersedes the earlier emoji presentation requests.
- Changes: shared icon/label and type chooser components cover all Field surfaces.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 359 tests across 54 files and the production build.
  Six decorative type icons, plain option names, typeahead and selected-label
  truncation are covered. Independent review and staged diff/secret checks passed.
  No browser testing.
- Commit: SELF (this commit).

## M7-T02R: Disable built-in cards as a whole

- Status: Complete; dependency M7-T02Q is complete.
- Scope/acceptance: see M7-T02R in `docs/implementation-plan.md`.
- Changes: disabled whole-card presentation for Title/Description; remove all
  action buttons and use a plain lock icon without a separate background.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 359 tests across 54 files and the production build.
  Built-in component/axe checks and independent review passed, including the
  accessible disabled group, absence of actions and transparent lock slot.
  Staged diff/secret inspection passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02S: Unify modal chrome and emphasize Custom creation

- Status: Complete; dependency M7-T02R is complete.
- Scope/acceptance: see M7-T02S in `docs/implementation-plan.md`; latest header
  requirements supersede earlier divider/zero-height-header styling.
- Changes: shared modal header/body/footer across editor and confirmation flows,
  section separators, balanced padding, scroll-end space, bordered Close buttons,
  borderless disabled buttons, and highlighted Custom/Sparkles preset choice.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 360 tests across 54 files and the production build.
  Wizard step/header, Custom card, editor chrome, nested footer ownership and
  existing form/pending/focus/a11y checks pass. Compiled CSS confirms disabled
  borders, section dividers, 40 px bottom spacing and horizontal safe areas.
  Independent review and staged diff/secret checks passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02T: Refine modal padding and wizard header

- Status: Complete; dependency M7-T02S is complete.
- Scope/acceptance: see M7-T02T in `docs/implementation-plan.md`.
- Changes: render the small step directly in the shared header; synchronize forward
  and back navigation and remove the wizard's body/portal step placement.
  Restore generous shared outer padding and align inset chrome dividers with
  section dividers, preserving safe areas and scroll space.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 361 tests across 54 files and the production build.
  Header forward/back and body-duplicate checks pass. Compiled CSS confirms
  restored desktop panel padding and matching body/chrome safe-area gutters.
  Independent review and staged diff/secret checks passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02U: Consistent modal actions and inline Field editing

- Status: Complete; dependency M7-T02T is complete.
- Scope/acceptance: see M7-T02U in `docs/implementation-plan.md`.
- Changes: Add Item actions/alignment, shared 44 px modal actions, same-surface
  Field editor with internal deletion, and six icon-labelled Gallery setting rows.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 364 tests across 54 files and the production build.
  Same-modal edit/back/pending/failure/save/delete, Add Item actions and Gallery
  radios/keyboard/preview/persistence/axe checks pass. Button audit confirms
  shared 44 px action/icon heights. Independent review and staged diff/secret
  checks passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02V: Equal-width Gallery setting controls

- Status: Complete; dependency M7-T02U is complete.
- Scope/acceptance: see M7-T02V in `docs/implementation-plan.md`.
- Changes: all six controls share a responsive width; choice buttons divide that
  width evenly and reuse standard modal Button corners and heights.
- Verification: Gallery regression passed (13 tests). `corepack pnpm
verify:deployment` passed formatting, lint, strict TypeScript, all 364 tests
  across 54 files and the production build. Independent review and staged
  diff/secret checks passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02W: Gallery visibility drag lists and centered preview

- Status: Complete; dependency M7-T02V is complete.
- Scope/acceptance: see M7-T02W in `docs/implementation-plan.md`.
- Changes: Visible/Hidden drag lists with a short dashed separator and accessible
  movement controls; centered preview rows; removed Gallery Cancel action.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 367 tests across 55 files and production build.
  Drag-handler tests cover row/container drops, empty lists, capacity, disabled
  state and outside drops; Gallery tests cover preview, ordering, save/failure
  and Close/discard. Independent review and staged diff/secret checks passed.
  No browser testing; rendered drag geometry was not tested.
- Commit: SELF (this commit).

## M7-T02X: Remove redundant modal Cancel actions

- Status: Complete; dependency M7-T02W is complete.
- Scope/acceptance: see M7-T02X in `docs/implementation-plan.md`.
- Changes: audited modal footers and removed Cancel where Close already exists;
  kept internal Back, page cancellation and explicit Keep editing choices.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 371 tests across 55 files and production build.
  Modal Close/focus/absence checks, internal Back, page Cancel and pending
  guards pass. Independent review and staged diff/secret checks passed.
  No browser testing.
- Commit: SELF (this commit).

## M7-T02Y: Simplify Gallery visibility and label display settings

- Status: Complete; dependency M7-T02X is complete.
- Scope/acceptance: see M7-T02Y in `docs/implementation-plan.md`.
- Changes: removed dashed divider and row eye buttons; added icons beside list
  headings, keyboard transfers and Display settings heading for the six controls.
- Verification: formatting, lint, strict TypeScript, all 373 tests across 55
  files and production build passed. Gallery tests cover drag targets, keyboard
  transfers/focus, capacity rejection and section labels. Independent review and
  staged diff/secret checks passed. No browser testing. An unrelated Field-delete
  confirmation test failed once in the gate; its isolated recheck and full suite
  rerun passed.
- Commit: SELF (this commit).

## M7-T02Z: Refine New Collection and balance modal chrome

- Status: Complete; dependency M7-T02Y is complete.
- Scope/acceptance: see M7-T02Z in `docs/implementation-plan.md`.
- Changes: New collection header, no step/checkmarks, Custom emphasis and preset
  badge, concise field guidance and adjacent Add field; symmetric shared chrome.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 373 tests across 55 files and production build.
  Wizard/draft/selection and shared layout/accessibility checks pass; independent
  review and staged diff/secret checks passed. No browser testing. An unrelated
  Item validation focus test failed once, then passed isolated and full reruns.
- Commit: SELF (this commit).

## M7-T02AA: Clarify schema editing and unify drag feedback

- Status: Complete; dependency M7-T02Z is complete.
- Scope/acceptance: see M7-T02AA in `docs/implementation-plan.md`.
- Changes: clearer field/option groups, shared sortable feedback, animated Custom
  selection, entire black preset strip and reduced modal vertical spacing.
- Verification: `corepack pnpm verify:deployment` passed formatting, lint,
  strict TypeScript, all 375 tests across 55 files and production build.
  Editor grouping/options/axe, real component pointer overlays, transfers/focus,
  preset strip/transition and shared spacing checks pass. Confirmation test now
  waits for its asynchronous action label. Independent review and staged
  diff/secret checks passed. No browser testing.
- Commit: SELF (this commit).

## M7-T02AB: Correct modal hierarchy and preset action

- Status: Complete; dependency M7-T02AA is complete.
- Scope/acceptance: see M7-T02AB in `docs/implementation-plan.md`.
- Changes: Display settings precedes its description and controls; the entire
  preset strip is one shared Button with two labels and preserved draft state.
- Verification: route types, formatting, lint, strict TypeScript, all 376 tests
  across 55 files (`corepack pnpm test --maxWorkers=2`) and production build
  passed. Full-strip/label/keyboard activation and draft preservation checks pass.
  Independent review and staged diff/secret checks passed. No browser testing.
  Initial default-concurrency run hit an existing Item-focus timing failure; the
  lower-concurrency full suite passed. Separate field-guidance wording edit was
  preserved outside this commit.
- Commit: SELF (this commit).

## M7-T02AC: Unify modal section headers and frame draft fields

- Status: Complete; dependency M7-T02AB is complete.
- Scope/acceptance: see M7-T02AC in `docs/implementation-plan.md`.
- Changes: shared modal section title/description/action structure, including both
  wizard screens and matching Add field spacing; bordered draft field editors
  with mobile-safe actions and divider-free compact confirmation prompts.
- Verification: route types, formatting, lint, strict TypeScript, all 376 tests
  across 55 files with two Vitest workers and production build passed. Shared
  headers in Settings and both wizard screens, framed editor/option/axe and
  confirmation/focus regressions pass. Independent review and staged diff/secret
  checks passed. No browser testing. Existing guidance wording is preserved.
- Commit: SELF (this commit).

## M7-T02AD: Honor selected gallery columns on mobile

- Status: Approved, queued; dependency M7-T02AC is complete.
- Scope/acceptance: see M7-T02AD in `docs/implementation-plan.md`.
- Verification: not started.
- Commit: pending.

## M7-T02AE: Audit and tighten shared presentation across pages and mobile

- Status: Complete; dependency M7-T02AC is complete; M7-T02AD remains queued.
- Scope/acceptance: see M7-T02AE in `docs/implementation-plan.md`.
- Changes: responsive type/shape scale, shared name ellipsis, native date bounds,
  compact artwork and audit documentation across route/feature/shared UI.
- Verification: route types, formatting, lint, strict TypeScript, all 386 tests
  across 56 files (two workers), and production build passed. Final section-role
  checks/build passed; compiled CSS confirms responsive typography/shape aliases,
  native date bounds and the 16 px input role. Name, size/color merging, exact
  deletion instruction and axe regressions pass. Independent review and staged
  diff/secret scan passed. No browser testing; actual mobile/date-picker visual
  acceptance remains open as documented in `docs/design-system-audit.md`.
- Commit: SELF (this commit).

## M7-T02AF: Place draft field Type beside Name

- Status: Complete; dependency M7-T02AE is complete; M7-T02AD remains queued.
- Scope/acceptance: see M7-T02AF in `docs/implementation-plan.md`.
- Changes: wider Name / narrower Type row on sufficiently wide field cards,
  with stacked layout retained for narrow phones.
- Verification: route types, formatting, lint, strict TypeScript, all 386 tests
  across 56 files (two workers) and production build passed. Compiled CSS confirms
  the 28 rem card-width query and 2:1 grid tracks. Diff/secret checks passed.
  No browser testing.
- Commit: SELF (this commit).
