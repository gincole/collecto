# little things MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use the repository's approved task-execution workflow and complete this plan one task at a time. Every task ends in one verified Conventional Commit, a `docs/tasks.md` update, a commit-hash report, and an approval stop.

**Goal:** Deliver the confirmed P0 private collection library as a secure, responsive Next.js application backed by Supabase and deployable to Vercel.

**Architecture:** Use Next.js App Router with server-first rendering and feature-owned modules. Supabase provides cookie-based authentication, PostgreSQL with RLS, and private image Storage. Zod schemas define all untrusted input boundaries; thin routes compose feature services and reusable UI components.

**Tech stack:** Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn/ui, Lucide, Zod, Supabase Auth/PostgreSQL/Storage, Vitest and Testing Library, Playwright, and Vercel.

---

## Planning rules

- The source authority and development rules are defined in `AGENTS.md`.
- Only P0 tasks are on the two-day MVP execution path. P1 and P2 are listed separately and remain unapproved for implementation.
- One task ID equals one atomic logical commit. Do not merge tasks into a larger commit.
- Each implementation task follows test-first steps: add a focused failing test, confirm the expected failure, implement the minimum behavior, run focused verification, run the task-level regression set, update `docs/tasks.md`, review the staged diff, and commit.
- Use Conventional Commits with a bullet-point body. The planned type and scope are mandatory unless the task itself reveals a more accurate approved classification.
- Paths below describe the intended feature-based layout. Task M0-T01 initializes the actual project; subsequent tasks should preserve these boundaries.

## Two-day priority and critical path

The timeline is a stretch target. Security and correctness are not negotiable. The critical path is:

`M0-T01 → M0-T02 → M1-T01 → M1-T02 → M2-T01 → M2-T02 → M3-T01 → M3-T02 → M4-T01 → M4-T02 → M5-T01 → M5-T02 → M6-T01 → M6-T02 → M7-T01 → M7-T02 → M8-T01 → M8-T02`

Suggested two-day allocation:

| Window            | Critical-path outcome                          | Parallel or optional P0 work if capacity remains |
| ----------------- | ---------------------------------------------- | ------------------------------------------------ |
| Day 1 hours 1–2   | M0 foundation and checks                       | Design-token contrast audit                      |
| Day 1 hours 3–5   | M1 database, RLS, and private Storage          | Database type generation                         |
| Day 1 hours 6–7   | M2 authentication and protected shell          | Auth responsive polish                           |
| Day 1 hours 8–10  | M3 Collection vertical slice                   | Additional preset artwork mappings               |
| Day 2 hours 1–3   | M4 Item CRUD and private images                | Failure-state polish                             |
| Day 2 hours 4–5   | M5 schema editor and dynamic forms             | Reorder ergonomics                               |
| Day 2 hours 6–7   | M6 gallery settings and Browse by              | Motion polish                                    |
| Day 2 hours 8–9   | M7 cross-feature accessibility and security QA | Non-critical visual refinement                   |
| Day 2 hours 10–11 | M8 seed, README, deployment, smoke test        | Screenshots                                      |

If time compresses, use the approved scope-cut order: omit P1 features; simplify drag ordering to explicit move controls; reduce the preset catalog only with user approval; simplify Browse presentation while preserving Select filtering; retain gallery columns, ratios, details, visible fields, Save, and Cancel. Never cut RLS, server authorization, core CRUD, persistence, or deployment verification.

## Planned file map

| Area                   | Primary responsibility                                                               |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `app/(auth)`           | Login and registration routes with minimal brand shell                               |
| `app/(app)`            | Protected layout and thin page composition                                           |
| `components/ui`        | shadcn/ui primitives and accessible narrow extensions                                |
| `components/shared`    | Header, page container, artwork, feedback, dialogs, and skeletons                    |
| `features/auth`        | Auth schemas, actions, forms, and session behavior                                   |
| `features/collections` | Presets, Collection validation, queries, actions, wizard, cards, and settings        |
| `features/fields`      | Field and option validation, mutations, editors, and reorder controls                |
| `features/items`       | Dynamic Item values, CRUD, image operations, forms, and details                      |
| `features/gallery`     | View-config validation, gallery rendering, settings draft, sorting, and Browse state |
| `lib/supabase`         | Browser/server clients, cookie refresh, generated database types, and test helpers   |
| `lib/env`              | Zod-validated environment configuration                                              |
| `supabase/migrations`  | Schema, indexes, RLS, Storage policies, and cleanup-support records                  |
| `supabase/seed`        | Idempotent fictional demo data and admin-only reset workflow                         |
| `tests/e2e`            | Critical multi-page and cross-account journeys                                       |
| `docs/tasks.md`        | Canonical task status, verification results, and commit hashes                       |

## Resolved planning assumptions

These values implement the approved non-blocking assumptions and may be changed only through a documented decision update:

- Package manager: pnpm.
- Maximum lengths: Collection name 100 characters; Collection description 1,000; Item title 200; Item description 5,000; Field name 64; Select option label 64; URL 2,048.
- Schema limits: at most 30 custom fields per Collection and 50 options per Select field.
- Preset Select options:
  - Book Genre: Fiction, Nonfiction, Fantasy, Mystery, Romance, Sci-Fi, Other. Status: To Read, Reading, Finished.
  - Movie Genre: Action, Comedy, Drama, Fantasy, Horror, Romance, Sci-Fi, Other. Status: To Watch, Watching, Watched.
  - Song Genre: Pop, Rock, Hip-Hop, Electronic, Jazz, Classical, Other.
  - Collectibles Category: Apparel, Accessories, Home, Collectibles, Other. Status: Wanted, Ordered, Owned.
  - Shopping Status: Idea, Planned, Purchased.
  - Favorites Category: Books, Movies, Music, Food, Places, Other.
- Missing optional Item Detail rows are omitted.
- Title sorting uses browser-locale-aware comparison in the UI/query mapping, with creation timestamp and UUID tie-breakers.

## Milestone M0 Foundation

### M0-T01 Initialize the application and development toolchain

- **Critical path:** Yes
- **Depends on:** Documentation approval
- **Scope:** P0 foundation only
- **Expected commit:** `chore(app)`

**Files:** create the Next.js App Router project files in the repository root; create `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `lib/env/server.ts`, `lib/env/client.ts`, `vitest.config.ts`, `playwright.config.ts`, test setup, and safe ignore rules; update `package.json`, `.env.example`, and `docs/tasks.md`.

**Subtasks:**

1. Initialize Next.js with App Router, strict TypeScript, Tailwind, ESLint, and the approved package manager.
2. Install only approved foundation dependencies: Supabase SSR/client, Zod, shadcn/ui prerequisites, Lucide, test runner, Testing Library, and Playwright.
3. Define scripts for format check, lint, typecheck, unit tests, end-to-end tests, and production build.
4. Add Zod environment parsing that exposes only the two public Supabase variables to browser code.
5. Add a smoke test for the root route and a configuration test that fails safely when required variables are missing.

**Acceptance criteria:** App Router boots; TypeScript is strict; no secret value is committed; tests and scripts execute; missing configuration produces a clear server-side error without printing values.

**Verification:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; expected result is zero errors and a successful production build using safe test environment values.

### M0-T02 Establish feature boundaries and shared primitives

- **Critical path:** Yes
- **Depends on:** M0-T01
- **Scope:** P0 architecture and shared UI only
- **Expected commit:** `chore(architecture)`

**Files:** create feature index boundaries, `components/shared/page-container.tsx`, `components/shared/preset-artwork.tsx`, `components/shared/empty-state.tsx`, `components/shared/error-state.tsx`, `components/shared/loading-skeleton.tsx`, `components/shared/confirm-dialog.tsx`, and their tests.

**Subtasks:**

1. Create the feature directory layout documented in `AGENTS.md` without placeholder business implementations.
2. Add the minimum shadcn/ui primitives required by the first vertical slices.
3. Implement shared primitives with explicit props, keyboard behavior, accessible names, and no feature-owned data access.
4. Map approved preset keys to Lucide icons and pastel semantic tokens through `PresetArtwork`.
5. Test semantic headings, focusable actions, decorative artwork treatment, and error retry behavior.

**Acceptance criteria:** Shared primitives are reusable, responsive, accessible, and domain-neutral; feature folders do not depend circularly on one another.

**Verification:** unit/component tests, lint, typecheck, and Storybook-free visual inspection at 320 and 1440 px using a temporary test page removed before commit.

### M0-T03 Implement centralized design tokens and application shell styles

- **Critical path:** No, but required before UI completion
- **Depends on:** M0-T01
- **Scope:** Complete the confirmed visual tokens and typography, extending the minimal semantic color foundation required by M0-T02
- **Expected commit:** `feat(design-system)`

**Files:** audit and extend `app/globals.css` and Tailwind configuration; create font setup and token tests; update `docs/design-system.md` only if implementation reveals an approved token correction.

**Subtasks:**

1. Encode approved neutral, semantic, and preset-artwork colors as CSS variables and Tailwind mappings.
2. Configure Plus Jakarta Sans and Noto Sans Thai-compatible fallback behavior.
3. Encode spacing, radii, shadows, motion, container widths, and focus ring tokens.
4. Add reduced-motion behavior and minimum control-height utilities.
5. Verify normal-text contrast and record any necessary semantic-token adjustment without changing the approved visual direction.

**Acceptance criteria:** Feature components can use semantic classes without raw repeated design values; focus, destructive, error, success, disabled, and selection tokens are available; typography renders English and Thai sample content safely.

**Verification:** token unit checks where applicable, contrast audit, keyboard focus inspection, reduced-motion inspection, lint, typecheck, and build.

## Milestone M1 Database security and Supabase foundation

### M1-T01 Create the core PostgreSQL schema and generated types

- **Critical path:** Yes
- **Depends on:** M0-T01
- **Scope:** P0 database model
- **Expected commit:** `feat(database)`

**Files:** create the first timestamped migration under `supabase/migrations`, database contract tests, and generated types at `lib/supabase/database.types.ts`; update `docs/database-design.md` if the migration requires an approved clarification.

**Subtasks:**

1. Define field-type and cleanup-status enums or equivalent checked values.
2. Create `collections`, `field_definitions`, `field_options`, `items`, and `storage_cleanup_jobs` with UUIDs, timestamps, checks, foreign keys, and cascades.
3. Add approved length/count validation constants at the application boundary; use database limits for invariant protection.
4. Add indexes for owner/time, collection/position, field/position, and collection/time queries.
5. Add database-level tests for cascades, checks, uniqueness, JSON defaults, and deterministic positions.

**Acceptance criteria:** The migration applies to a clean database; schema matches `docs/database-design.md`; deleting a Collection cascades database children but does not pretend to delete Storage objects.

**Verification:** Supabase local migration reset when available, schema tests, generated-type diff review, lint, and typecheck. Connected verification waits for supplied Supabase values.

### M1-T02 Add Row Level Security and ownership tests

- **Critical path:** Yes
- **Depends on:** M1-T01
- **Scope:** P0 authorization
- **Expected commit:** `feat(security)`

**Files:** create a timestamped RLS migration and SQL/integration tests for Collections, Fields, Options, Items, and cleanup records.

**Subtasks:**

1. Enable RLS on every user-data table.
2. Add Collection policies using `auth.uid()` for select, insert, update, and delete with correct checks.
3. Add child policies that derive ownership through the parent Collection.
4. Restrict cleanup-job access to server/admin workflows.
5. Test User A versus User B for list, direct-ID read, insert, update, and delete attempts.

**Acceptance criteria:** Cross-account access returns no private data and cannot mutate records; policy checks do not rely on UI filtering; same-owner operations succeed.

**Verification:** local Supabase policy tests or connected tests when credentials are supplied; document unavailable connected checks in `docs/tasks.md` rather than claiming success.

### M1-T03 Configure private item-image Storage policies

- **Critical path:** Yes for image work
- **Depends on:** M1-T02
- **Scope:** P0 private images
- **Expected commit:** `feat(storage)`

**Files:** create Storage bucket/policy migration and integration tests; create server-only path and authorization helpers.

**Subtasks:**

1. Define the private `item-images` bucket.
2. Enforce owner-scoped paths in the form `userId/collectionId/itemId/randomUUID.ext`.
3. Authorize upload, read/sign, replace, and delete against authenticated Collection ownership.
4. Reject cross-user paths and unsupported operations.
5. Test that no object is publicly readable and signed access is time-limited.

**Acceptance criteria:** Images cannot be accessed publicly or across accounts; path generation never uses the original filename; server-only helpers perform ownership checks.

**Verification:** Storage policy integration tests and direct unauthorized request checks.

## Milestone M2 Authentication and protected shell

### M2-T01 Add Supabase SSR clients and session refresh

- **Critical path:** Yes
- **Depends on:** M0-T01, M1-T02
- **Scope:** P0 auth infrastructure
- **Expected commit:** `feat(auth)`

**Files:** create `lib/supabase/client.ts`, `lib/supabase/server.ts`, proxy or middleware session-refresh code following the installed Next.js/Supabase versions, and auth test helpers.

**Subtasks:**

1. Build separate browser and server client factories with cookie-based sessions.
2. Refresh sessions without exposing server-only configuration.
3. Define protected-route and safe-return-URL helpers.
4. Add tests for unauthenticated redirects, preserved safe return paths, and rejected external return URLs.

**Acceptance criteria:** Server Components can read the current user; sessions survive refresh; unsafe redirects are rejected; no secret key reaches browser bundles.

**Verification:** focused unit/integration tests, bundle/environment review, lint, typecheck, and build.

### M2-T02 Implement registration login logout and account menu

- **Critical path:** Yes
- **Depends on:** M2-T01, M0-T03
- **Scope:** P0 auth UI
- **Expected commit:** `feat(auth)`

**Files:** create auth schemas/actions/forms, `/login`, `/register`, protected shell layout, `AppHeader`, account menu, loading/error states, and tests.

**Subtasks:**

1. Add Zod email/password validation and generic authentication error mapping.
2. Implement registration and login actions that match actual Supabase confirmation settings.
3. Implement current-session logout only.
4. Build the minimal brand-only auth shell and responsive 400–440 px desktop form/full-width mobile form.
5. Build the protected top navigation with My Library, email, and Logout.
6. Test submitting/disabled states, invalid credentials, server error, successful redirect, session persistence, keyboard flow, and mobile keyboard visibility.

**Acceptance criteria:** Unauthenticated users cannot access app routes; authenticated users see email and can log out; errors do not disclose account existence; no social login or P1 account features appear.

**Verification:** component tests, auth integration tests, Playwright auth smoke test, 320/375/1440 responsive inspection, keyboard pass, lint, typecheck, and build.

## Milestone M3 Collections vertical slice

### M3-T01 Define presets Collection contracts and server operations

- **Critical path:** Yes
- **Depends on:** M1-T02, M2-T02
- **Scope:** P0 preset and Collection domain
- **Expected commit:** `feat(collections)`

**Files:** create preset definitions, Select option assumptions, Collection Zod schemas, queries, actions, and tests.

**Subtasks:**

1. Define approved stable keys and display labels and the PTS field lists.
2. Encode the concrete default Select options listed under Resolved planning assumptions; keep copied options editable after creation.
3. Define default gallery configuration: three preferred columns, cover, details on, normal spacing, newest first, approved preset ratios, and Title-primary fields.
4. Implement list/get/create/update/delete operations with authentication, ownership, validation, structured errors, and atomic database creation of copied fields/options.
5. Test that wizard selection performs no write, final creation copies independent schema, duplicate submission is safe, and unauthorized IDs do not leak ownership.

**Acceptance criteria:** Presets are code-owned; final Create persists a complete independent Collection schema; all operations authorize server-side.

**Verification:** unit tests for presets and schemas, integration tests for operations and ownership, lint, typecheck.

### M3-T02 Implement My Library and Create Collection wizard

- **Critical path:** Yes
- **Depends on:** M3-T01, M0-T02, M0-T03
- **Scope:** P0 Collection UI
- **Expected commit:** `feat(collections)`

**Files:** create `/library`, `/collections/new`, Collection cards/grid, two-step wizard, responsive states, and tests.

**Subtasks:**

1. Render My Collections with artwork, name, item count, overflow Rename/Delete, skeleton, no-Collections CTA, and retry error.
2. Do not add P1 search or sort despite their appearance in the reference design.
3. Build accessible preset selection with outline/check selection and disabled Continue.
4. Build details step with required name, optional description, Change preset, and actual field preview.
5. Preserve values across Back and failed Create; confirm cancel only when dirty; prevent duplicate submit.
6. Verify responsive grids: 1–2 mobile, 2–3 tablet, and 3–4 desktop.

**Acceptance criteria:** User can create Blank and preset Collections and return later to persisted data; no record is written before final Create; keyboard and mobile flows are usable.

**Verification:** component tests, Playwright create flow, loading/empty/error tests, 320/375/640/1024/1440 inspection, accessibility scan, lint, typecheck, build.

### M3-T03 Implement Collection identity settings and permanent deletion

- **Critical path:** No, but required P0
- **Depends on:** M3-T02
- **Scope:** P0 Collection update/delete
- **Expected commit:** `feat(collections)`

**Files:** create `/collections/[id]/settings` general section, update form, destructive area, delete action, cleanup scheduling, and tests.

**Subtasks:**

1. Implement name and description update with dirty, saving, success, and error states.
2. Add precise permanent-deletion copy with Item/image counts.
3. Require typed Collection name only when one or more Items exist.
4. Delete database records and schedule or attempt image cleanup according to the documented non-atomic workflow.
5. Redirect safely after success and retain retryable state after failure.

**Acceptance criteria:** Settings are a dedicated page; deletion never implies undo; populated deletion requires exact name; cleanup failures are recorded.

**Verification:** component/integration tests for empty and populated deletion, ownership tests, keyboard dialog test, lint, typecheck.

## Milestone M4 Items and images vertical slice

### M4-T01 Implement Item schema-driven CRUD without images

- **Critical path:** Yes
- **Depends on:** M3-T01, M1-T02
- **Scope:** P0 Item domain and forms
- **Expected commit:** `feat(items)`

**Files:** create Item schemas, value normalization, queries/actions, dynamic field renderer, Add/Edit routes, tests.

**Subtasks:**

1. Model required built-in Title, optional Description, and JSONB values keyed by field UUID.
2. Render Text, Number, date-only Date, Rating 1–5, single Select, and HTTP/HTTPS URL controls in field order.
3. Build server validation from the current Collection schema and reject unknown fields/options.
4. Omit empty optional JSONB keys and preserve form values after errors.
5. Implement create, update, get, list, and delete operations with parent ownership checks.
6. Add adjacent errors, first-error focus, disabled duplicate submit, and responsive stacked/two-column form composition.

**Acceptance criteria:** Items with every supported field type persist and reload; invalid or stale schema submissions fail safely; unauthorized users cannot read or mutate by direct ID.

**Verification:** validation unit tests, action integration tests, form component tests, Playwright create/edit flow, keyboard and 320/1440 responsive checks.

### M4-T02 Add private single-image upload replace remove and full-size view

- **Critical path:** Yes
- **Depends on:** M4-T01, M1-T03
- **Scope:** P0 Item images
- **Expected commit:** `feat(images)`

**Files:** create image schemas/services/uploader/viewer, authorized signed-view route or action, cleanup workflow, and tests.

**Subtasks:**

1. Validate JPEG, PNG, and WebP at no more than 5 MB on client for UX and on server as authority.
2. Verify MIME and decodability and generate the approved private path.
3. Implement upload with rollback or cleanup accounting if the Item write fails.
4. Implement replace and remove while accounting for old-object cleanup failure.
5. Add optional preview, retry, fallback, and authenticated full-size viewer.
6. Test missing image, invalid file, oversize file, upload failure, database failure, cleanup failure, expired signed URL, and unauthorized direct access.

**Acceptance criteria:** Each Item has zero or one private image; no public URL or original filename is stored; failures preserve form data and do not silently orphan objects.

**Verification:** service unit tests, Storage integration tests, Playwright image flow, unauthorized URL checks, lint, typecheck, build.

### M4-T03 Implement Item Details and destructive deletion

- **Critical path:** No, but required P0
- **Depends on:** M4-T02
- **Scope:** P0 Item read/delete UI
- **Expected commit:** `feat(items)`

**Files:** create Item Details route and components, metadata formatting, Edit/Delete actions, missing states, and tests.

**Subtasks:**

1. Render image first on mobile and image/details columns on desktop.
2. Resolve Select option IDs to current labels and omit empty optional rows.
3. Render Rating as an accurate 1–5 value without fabricated data.
4. Add accessible full-size image, Edit, and confirmed Delete actions.
5. Redirect edit success to details and delete success to Collection Detail.

**Acceptance criteria:** Details never invent values, handles missing/broken images, follows field order, and preserves ownership checks on every action.

**Verification:** component tests, Playwright view/edit/delete flow, no-image test, responsive and keyboard inspection.

## Milestone M5 Dynamic schema management

### M5-T01 Implement Field and Select option mutations

- **Critical path:** Yes
- **Depends on:** M4-T01
- **Scope:** P0 custom schema behavior
- **Expected commit:** `feat(fields)`

**Files:** create Field/Option schemas, actions, cleanup functions, and integration tests.

**Subtasks:**

1. Implement add, rename, required toggle, reorder, and delete for custom fields.
2. Keep field type immutable after creation.
3. Implement add, rename, reorder, and delete for Select options with stable IDs.
4. Enforce case-insensitive unique field names per Collection and option labels per field.
5. On Field deletion, warn when populated, remove JSONB keys and gallery references, and invalidate active Browse state.
6. On Option deletion, clear matching values so Items become Uncategorized.
7. Test rename preservation, required-field behavior on subsequent saves, ordering, cleanup, and ownership.

**Acceptance criteria:** Schema changes preserve stable-ID associations and perform all specified cleanup; no destructive data loss is silent.

**Verification:** unit and database integration tests including populated deletes and direct unauthorized calls.

### M5-T02 Implement Collection field and option editors

- **Critical path:** Yes
- **Depends on:** M5-T01, M3-T03
- **Scope:** P0 Settings UI
- **Expected commit:** `feat(fields)`

**Files:** add Fields section to Collection Settings; create Field list/editor, Select option editor, reorder controls, dialogs, and tests.

**Subtasks:**

1. Display field name, immutable type, required state, option count, and actions.
2. Keep built-in Title and Description visually distinct and non-deletable.
3. Use desktop drag handles only as enhancement; provide Move up/down for keyboard and touch.
4. Use a full-screen editor on mobile and adaptive panel/inline editor on larger screens.
5. Add precise destructive warnings and return focus after dialogs.
6. Test keyboard-only add/edit/reorder/delete and mobile overflow.

**Acceptance criteria:** Users can manage the complete supported schema without drag-and-drop; field order immediately controls Item forms/details.

**Verification:** component tests, Playwright schema-edit flow, keyboard/focus pass, 320/375/768/1440 inspection, accessibility scan.

## Milestone M6 Gallery and Browse by

### M6-T01 Implement responsive gallery rendering and sorting

- **Critical path:** Yes
- **Depends on:** M4-T03, M5-T01
- **Scope:** P0 Collection Detail gallery
- **Expected commit:** `feat(gallery)`

**Files:** create Collection Detail route, header, gallery config schema, query/sort mapping, GalleryGrid/Card, states, and tests.

**Subtasks:**

1. Validate columns 1–5, all five ratios, cover/contain, details, up to three unique fields, spacing, sort, and direction.
2. Render Collection artwork, title, description, Item count, Add Item, and Collection actions.
3. Render responsive effective columns without changing the saved preference.
4. Render one-column mode as a horizontal list card.
5. Hide all text when details are off; otherwise render ordered fields with graceful truncation and missing values.
6. Implement newest, oldest, title A–Z, and title Z–A with deterministic tie-breakers.
7. Add loading, no-Items, error/retry, missing-image, and image-reserved-space states.

**Acceptance criteria:** Gallery behavior matches every confirmed setting at required viewports and never overflows narrow screens.

**Verification:** schema unit tests, component matrix tests, visual viewport matrix, Playwright gallery smoke, reduced-motion and layout-shift inspection.

### M6-T02 Implement Gallery Settings draft preview Save and Cancel

- **Critical path:** Yes
- **Depends on:** M6-T01
- **Scope:** P0 gallery customization
- **Expected commit:** `feat(gallery)`

**Files:** create settings sheet/full-screen surface, draft reducer or form, preview, mutation, close confirmation, and tests.

**Subtasks:**

1. Use the real GalleryCard renderer for preview with real Items or a representative empty sample.
2. Keep all changes in local draft state until Save.
3. Preserve chosen field IDs/order when details are toggled off.
4. Support built-in Title/Description and eligible custom fields with a maximum of three.
5. Sanitize deleted field references without duplicates.
6. Implement Save feedback, Cancel discard, and dirty-close confirmation.
7. Render a desktop right sheet and mobile full-screen view without hiding gallery content or Save.

**Acceptance criteria:** Save persists one Collection config shared across views; Cancel and dirty close do not persist; preview and saved gallery render consistently.

**Verification:** reducer/schema tests, action integration tests, component tests, Playwright Save/Cancel/refresh flow, 320/375/768/1440 inspection.

### M6-T03 Implement Select-based Browse tabs and virtual folders

- **Critical path:** Yes
- **Depends on:** M6-T02, M5-T01
- **Scope:** P0 Browse by
- **Expected commit:** `feat(browse)`

**Files:** create Browse query validation, tabs, folder cards/grid, filtered gallery composition, URL state helpers, and tests.

**Subtasks:**

1. Render All plus one tab per single-Select field and no tabs for other types.
2. Render every option including zero-count options and an Uncategorized folder for missing values.
3. Store validated field and option IDs in URL query parameters. The reserved `selectedOptionId=uncategorized` value selects missing values; an absent option parameter shows the folder overview.
4. Clear the old option when changing fields and clear all filters on All.
5. Recover safely from stale/deleted/foreign IDs without leaking resource existence.
6. Reuse the saved Gallery configuration in every folder.
7. Make mobile tabs horizontally scrollable and keyboard accessible.

**Acceptance criteria:** Counts and membership update after Item changes; renames preserve membership; deletions recover correctly; refresh/back preserves valid state.

**Verification:** query/helper unit tests, integration tests for counts and Uncategorized, Playwright refresh/back/rename/delete flow, mobile keyboard and overflow checks.

## Milestone M7 Cross-feature quality security and responsive acceptance

### M7-T01 Add complete application states and feedback audit

- **Critical path:** Yes
- **Depends on:** M2-T02 through M6-T03
- **Scope:** P0 state completeness
- **Expected commit:** `fix(ux)`

**Files:** modify feature state components and tests only where the audit finds missing confirmed behavior.

**Subtasks:**

1. Audit auth, Library, Collection, Browse, Item form/details, Settings, Gallery Settings, and image viewer against the state matrix.
2. Add missing loading, empty, filtered-empty, validation, saving, success, unauthorized, not-found, error, and retry treatments.
3. Ensure errors preserve safe form or draft state and toasts do not obscure controls.
4. Confirm destructive copy gives exact consequences and prevents repeat submissions.

**Acceptance criteria:** Every confirmed state has a deterministic UI and test; no blank or misleading screen remains.

**Verification:** state-matrix component tests and targeted Playwright failure simulations.

### M7-T01A Customize preset Fields before final Create

- **Depends on:** M7-T01
- **Scope:** User-requested preset customization before creating a Collection, recorded from the manual test on 30 October 2026.
- **Expected commit:** `feat(collections)`

Add a local schema draft to the existing wizard for Field name/type/required/order and Select options. Validate the entire submitted draft on the server, create Collection/Fields/Options atomically, preserve idempotency and cancellation behavior, and make no pre-submit writes. Keep persisted Field types immutable. Verify preset and Blank drafts, validation, persistence, failures, and ownership using focused tests. This is a separate implementation task, not part of the M7-T01 state audit.

### M7-T02 Run accessibility and responsive conformance fixes

- **Critical path:** Yes
- **Depends on:** M7-T01
- **Scope:** P0 WCAG and viewport requirements
- **Expected commit:** `fix(accessibility)`

**Files:** modify only components implicated by the audit; add accessibility and viewport regression tests.

**Subtasks:**

1. Test 320, 375, 640, 768, 1024, and 1440 px for overflow, hidden actions, keyboard obstruction, and safe-area behavior.
2. Run keyboard-only flows for cards, menus, tabs, dialogs, sheets, forms, and reorder controls.
3. Verify accessible names, labels, descriptions, error relationships, dialog focus return, and non-color selection indicators.
4. Verify 44×44 targets, 4.5:1 normal-text contrast, reduced motion, image reserved space, and no major layout shifts.
5. Add automated accessibility checks to critical Playwright routes and document manual checks.

**Acceptance criteria:** No known P0 accessibility or responsive defect remains at the required viewports.

**Verification:** automated accessibility tests, viewport matrix, keyboard checklist, contrast report, lint, typecheck, build.

### M7-T02A Standardize destructive actions and notification UX

- **Depends on:** M7-T01
- **Scope:** User-requested consistency correction for delete controls, transient top toasts, and custom form validation across existing flows.
- **Expected commit:** `fix(ux)`

Use shared deletion triggers/menu links and permanent-confirmation styling while preserving exact impact, ownership checks, typed Collection confirmation, and pending guards. Replace permanent outcome banners with timed animated toasts, pause dismissal during interaction, preserve inline errors, and audit every form for native validation popovers. Verify shared controls, timers, focus, validation dispatch, and existing deletion/recovery flows with unit tests; no browser tests per user instruction. Record the separate Browse-pending and scrollbar-gutter gaps under M7-T02.

### M7-T02B Complete immediate loading feedback

- **Depends on:** M7-T02A (complete)
- **Scope:** user-requested correction of delayed or absent feedback, separate from the broader responsive audit.
- **Requirements:** PTS loading/feedback and double-submit protection; UX sections 21 and 23; B12 validated Browse URL state.
- **Acceptance:** Browse tabs, folders, and folder-back render immediately from loaded Items while synchronizing the URL; authoritative server state and ownership checks remain intact. Navigation has feedback before route skeletons arrive, including initial layout loading. Retries, Field/Option mutations, wizard cancellation, and private images visibly indicate pending work. Local draft edits remain immediate. Preserve modified links, errors, image retry, reduced motion, and reserved image geometry.
- **Verification:** deferred-request component tests, existing ownership/route and mutation tests, formatter, lint, strict TypeScript, full Vitest suite, dependency audit, production build, and diff review. Browser and hosted checks excluded per user instruction; no claim of measured end-to-end latency or final visual conformance.

### M7-T02C Apply DESIGN.md across the application

- **Depends on:** M7-T02B (complete)
- **Scope:** explicit user request to adopt the new Awesomic visual reference throughout existing screens. See `docs/visual-direction.md` for authority changes and accessibility exceptions.
- **Acceptance:** use the zinc palette, DM Sans substitute with Thai fallback, reference typography, 36 px cards/14 px controls, 1200 px page container, consistent panel padding, border-led content surfaces, and restrained floating elevation. Cover Auth, header, Library, wizard, Collection/Field settings, Browse/folders, gallery/preview, Item forms/details, dialogs, feedback and loading/error/empty states. Preserve CRUD, privacy, confirmation, gallery columns 1–5, all ratios, responsive form factors, minimum input/touch sizes, contrast and pending feedback. Reserve a stable scrollbar gutter.
- **Verification:** design token/contrast regressions and existing component tests, formatter, ESLint, strict TypeScript, full Vitest suite, dependency audit, configured production build, and focused diff review. No browser/hosted tests per user instruction; full M7-T02 conformance remains separate.
- **Expected commit:** `style(ui)` with the source reference, authority mapping, and task tracker included.

### M7-T03 Complete security and failure-path test suite

- **Critical path:** No, but release-blocking P0
- **Depends on:** M7-T01, M1-T03
- **Scope:** P0 security acceptance
- **Expected commit:** `test(security)`

**Files:** add integration/end-to-end tests and test fixtures; do not weaken production policies for testing.

**Subtasks:**

1. Test two-account isolation for every table, mutation, direct ID, and private image.
2. Test unknown JSONB fields, wrong types, foreign option IDs, invalid gallery settings, unsafe return URLs, and forged owner IDs.
3. Test database-write versus Storage-failure permutations and retry records.
4. Test simultaneous shared-demo sessions and disclosed last-write-wins recovery.
5. Confirm logs and user errors omit credentials, signed URLs, private content, and ownership detail.

**Acceptance criteria:** Security acceptance criteria have executable evidence; failures are safe and recoverable.

**Verification:** full integration and security suite with a recorded result in `docs/tasks.md`.

## Milestone M8 Demo delivery and deployment

### M8-T01 Add fictional seed data and protected reset workflow

- **Critical path:** Yes
- **Depends on:** M6-T03, M7-T03
- **Scope:** P0 demo
- **Expected commit:** `feat(demo)`

**Files:** create idempotent seed/reset scripts under `supabase/seed` or `scripts`, documentation, and tests.

**Subtasks:**

1. Seed My Books, Food Memories, and My Collectibles with 5–8 fictional Items each, representative fields/options, gallery configurations, and safe image fixtures if used.
2. Associate seed data only with the configured demo user and never embed its password.
3. Make reset admin-only and unavailable from public routes.
4. Verify two sessions can see and mutate the same demo state.
5. Document user-owned credential rotation and reset execution.

**Acceptance criteria:** Seed/reset is repeatable, fictional, non-sensitive, and cannot be triggered by a demo visitor.

**Verification:** clean seed, mutate, reset, and compare expected counts; secret scan; two-session smoke test.

### M8-T02 Complete README and release verification

- **Critical path:** Yes
- **Depends on:** M8-T01, M7-T02
- **Scope:** P0 delivery package
- **Expected commit:** `docs(release)`

**Files:** create or update `README.md`, architecture/ERD references, setup instructions, known limitations, demo instructions, and screenshots only when available.

**Subtasks:**

1. Document product, features, architecture, security, privacy, setup, environment variable names, commands, demo behavior, limitations, and P1/P2 roadmap.
2. Include the ERD and link to `docs/database-design.md` and `docs/design-system.md`.
3. Run formatter, lint, typecheck, unit, integration, end-to-end, secret scan, and production build.
4. Verify all acceptance criteria and record exceptions without claiming success.

**Acceptance criteria:** A new contributor can configure and verify the project without secret values; release checks are reproducible; known limitations are explicit.

**Verification:** execute every documented setup/check command from a clean checkout or equivalent isolated environment.

### M8-T03 Configure Vercel and perform production smoke test

- **Critical path:** Deployment endpoint
- **Depends on:** M8-T02 and explicit deployment authorization
- **Scope:** P0 deployment
- **Expected commit:** `chore(deploy)` if repository changes are necessary; otherwise record no commit and update the tracker in the next authorized documentation commit.

**Files:** Vercel configuration only if needed; update README URLs and `docs/tasks.md`. Never commit populated secrets.

**Subtasks:**

1. Create or connect the Vercel project only at deployment time.
2. Configure public Supabase URL/publishable key and any server-only secrets in Vercel.
3. Configure allowed Supabase Auth redirect URLs for production.
4. Deploy and smoke-test registration/login/logout, protected routes, Collection and Item CRUD, private images, field edits, gallery settings, Browse state, refresh persistence, and two-account isolation.
5. Record production URL and verification evidence.

**Acceptance criteria:** Production deployment passes the critical smoke test and does not expose secrets or private images.

**Verification:** production Playwright smoke where safe, manual cross-account check, security headers and private-object check.

## Deferred P1 backlog

These tasks are not part of the two-day MVP and require explicit promotion before execution:

| ID     | Task                                                          | Depends on | Expected commit     |
| ------ | ------------------------------------------------------------- | ---------- | ------------------- |
| P1-T01 | Library and Item search with clear no-results state           | M8-T02     | `feat(search)`      |
| P1-T02 | Library sorting controls                                      | M3-T02     | `feat(collections)` |
| P1-T03 | Auth recovery and forgot-password flow                        | M2-T02     | `feat(auth)`        |
| P1-T04 | Display name profile support                                  | M2-T02     | `feat(profile)`     |
| P1-T05 | Authenticated original-image download                         | M4-T02     | `feat(images)`      |
| P1-T06 | Desktop breadcrumbs and broader dirty-navigation prompts      | M7-T02     | `feat(navigation)`  |
| P1-T07 | First-Item/custom Collection cover and polished illustrations | M3-T02     | `feat(artwork)`     |

## Deferred P2 backlog

These require new product design and security review:

| ID     | Task group                                                |
| ------ | --------------------------------------------------------- |
| P2-T01 | Public Collections, sharing, and collaboration            |
| P2-T02 | Nested folders and advanced filtering                     |
| P2-T03 | Multiple saved gallery views                              |
| P2-T04 | Multi-image Items, Item duplication, and move             |
| P2-T05 | Collection duplication and pinning                        |
| P2-T06 | Theme, avatar, export/backup, account deletion, and trash |
| P2-T07 | Google OAuth                                              |

## Plan approval gate

No task may begin until this plan, `docs/tasks.md`, `docs/design-system.md`, `docs/database-design.md`, and `.env.example` are approved. After approval, execute only the first authorized atomic task. Report its commit hash and stop.
