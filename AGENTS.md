# AGENTS.md

## Purpose

This file defines the working rules for humans and coding agents contributing to `collecto`. Follow it before planning, changing, testing, committing, or deploying the application.

The project is the private personal collection application branded **little things.** The MVP lets an authenticated owner create customizable Collections, define ordered fields, create Items with zero or one private image, browse Select-based virtual folders, and configure one responsive gallery view per Collection.

## Requirement authority

Use the project sources in this order:

1. `../Personal_Collection_Library_Updated_Product_Technical_Spec.docx` controls functional behavior, scope, data, architecture, security, and acceptance criteria.
2. `../Personal_Collection_Library_UX_UI_Specification_Expanded_v2.docx` controls detailed interaction, responsive behavior, accessibility, components, and visual design when it does not conflict with the Product and Technical Specification.
3. `../Personal_Collection_Annotated_Screen_Designs_REVISED.pdf` is a visual reference. It does not override written rules or promote a P1 or P2 feature into P0.
4. `../docs/decisions.md` records approved resolutions and defaults. `../docs/requirements-review.md` records the consolidated requirements and known assumptions.

Do not silently reinterpret, weaken, or expand a confirmed requirement. If a requested change conflicts with these sources, stop and document the conflict before editing application code.

## Scope control

- **P0** is the MVP and the only default implementation scope.
- **P1** is next-priority work and must not be implemented unless the task explicitly promotes it.
- **P2** is future work and must not be implemented unless explicitly approved as a scope change.
- A control shown in a mockup is not a requirement when the written specifications defer it.
- Do not add speculative abstractions, alternate workflows, extra field types, extra account features, or unrequested dependencies.
- Never cut authentication, ownership checks, RLS, server validation, persistence, core Collection or Item CRUD, or a functioning deployment to save time.

Examples of deferred work include search and library sorting, image download, breadcrumbs, forgot-password UI, display name, first-Item or custom Collection covers, sharing, collaboration, public links, nested folders, multi-image Items, multiple saved gallery views, export, trash, themes, and avatars.

## Required technology

- Use Next.js App Router and TypeScript.
- Use React Server Components by default. Add `"use client"` only at the smallest interactive boundary that needs browser state, effects, event handlers, or client-only APIs.
- Use Server Actions for authenticated mutations when appropriate. Use Route Handlers for HTTP responses, signed or authenticated file delivery, webhooks, and operations that require an explicit HTTP boundary.
- Use Tailwind CSS for styling and shadcn/ui primitives for accessible foundational controls.
- Use Lucide icons. MVP preset artwork is a semantic Lucide icon on an approved pastel background.
- Use Supabase Auth, PostgreSQL, Row Level Security, and private Storage.
- Use Zod at every untrusted input boundary. Client validation improves UX; server validation is authoritative.
- Deploy to Vercel when deployment is explicitly requested. Do not configure or push a deployment early without approval.
- Do not introduce a separate backend service, microservice, ORM, state framework, or design system unless the task demonstrates a concrete need and receives approval.

Pin dependency versions deliberately. Do not upgrade unrelated dependencies during a feature task.

## Project architecture

Use a feature-based architecture. Keep routing thin and business rules close to their owning feature.

Preferred shape:

```text
app/
  (auth)/
  (app)/
  api/
components/
  ui/                 # shadcn/ui primitives and narrowly-scoped extensions
  shared/             # cross-feature application components
features/
  auth/
  collections/
  fields/
  items/
  gallery/
lib/
  supabase/           # browser, server, middleware, and admin client factories
  validation/         # truly cross-feature schemas and validation helpers
  design/             # shared semantic presentation mappings when needed
  utils/
supabase/
  migrations/
  seed/
tests/
docs/
  tasks.md
```

The actual structure may adapt to the initialized repository, but preserve these boundaries:

- `app` owns routes, layouts, metadata, and page composition. It must not become the business-logic layer.
- Each `features/<feature>` directory owns its components, server operations, schemas, types, queries, mapping functions, and tests.
- `components/ui` contains reusable primitives, not domain behavior.
- `components/shared` is for genuinely cross-feature components such as `AppHeader`, `PageContainer`, `PresetArtwork`, `ConfirmDialog`, `EmptyState`, and `LoadingSkeleton`.
- Move code into `lib` only when it is domain-neutral and reused. Avoid generic dumping grounds.
- Keep Supabase row types separate from UI view models. Map data deliberately at feature boundaries.
- Do not create circular feature dependencies. Shared domain contracts must have one clear owner.
- Prefer small modules with explicit inputs and outputs. Split files that mix routing, database access, validation, and presentation.

## Next.js App Router rules

- Fetch private data on the server unless browser-driven refetching is required.
- Read the authenticated user on the server for protected routes and mutations.
- Never trust middleware alone for authorization. Recheck ownership at the data or mutation boundary.
- Use `loading.tsx`, `error.tsx`, `not-found.tsx`, Suspense, and feature-level state components intentionally rather than returning ambiguous blank screens.
- Keep URL state serializable and validated. Browse state uses validated `groupByFieldId` and `selectedOptionId` query parameters.
- Revalidate or redirect deliberately after mutations. Avoid stale UI and duplicate submissions.
- Do not expose server-only modules, service-role clients, or secret-bearing environment variables to Client Components.
- Use `next/navigation` APIs and App Router conventions. Do not introduce Pages Router code.

## TypeScript and validation

- Keep TypeScript strict. Do not weaken compiler settings to make errors disappear.
- Avoid `any`, unchecked type assertions, and non-null assertions. Narrow unknown data and model expected absence explicitly.
- Derive TypeScript types from Zod schemas where practical so runtime and compile-time contracts stay aligned.
- Validate route parameters, query parameters, form data, mutation payloads, database JSONB values, gallery configuration, and Storage metadata.
- Server validation must use the current Collection schema. Reject unknown custom-field IDs, wrong value types, invalid Select option IDs, duplicate visible fields, and fields belonging to another Collection.
- Return structured, typed success and error results. Do not leak stack traces, SQL details, ownership information, or secrets to users.

## Supabase data and security

- Every Collection belongs to exactly one authenticated user. Every child record is authorized through its parent Collection.
- Enable and test RLS on Collections, field definitions, field options, and Items.
- Collection policies must enforce `owner_id = auth.uid()` for reads and changes, including appropriate `WITH CHECK` rules.
- Child-table policies must verify ownership through the parent Collection. UI visibility is never an authorization mechanism.
- Never accept a client-supplied owner ID as authoritative.
- Use private Storage only. Store image paths, not public URLs.
- Item image paths follow `userId/collectionId/itemId/randomUUID.ext`.
- Authorize before issuing signed URLs or mutating images. Signed URLs must be time-limited.
- Images are optional and limited to one per Item. Accept JPEG, PNG, and WebP up to 5 MB. Verify MIME type and decodability on the server or trusted Storage boundary.
- Database transactions do not make Storage operations atomic. Define the operation order, avoid orphan objects, record cleanup failures, and provide a protected retry path.
- Use database constraints, foreign keys, cascades, checks, and indexes in addition to application validation.
- Preset definitions live in code. Final Collection creation copies fields and Select options into independently editable rows.
- Custom field types are immutable after creation in MVP.
- Store custom Item values in JSONB keyed by stable field UUID. Store Select option UUIDs rather than labels.
- Omit absent optional JSONB keys. Use null only where the built-in nullable column contract calls for it.

## Authentication and account behavior

- Use Supabase email and password authentication with persistent sessions and protected routes.
- P0 account UI shows the authenticated email and Logout only.
- Authentication errors must be safe and generic where detail could reveal account state.
- Log out the current session, not every concurrent session.
- The shared demo account is intentionally writable and last-write-wins. Clearly disclose that simultaneous users share data and may see each other's changes.
- Demo reset and seeding are admin-only operations and must never appear as a public control.
- Do not put the demo password in source code, committed documentation, seed files, screenshots, fixtures, logs, or error reports.

## Environment variables and secrets

- Never commit credentials, passwords, private keys, service-role keys, access tokens, or populated environment files.
- Commit only a safe `.env.example` containing variable names and non-secret descriptions.
- Store local secrets in an ignored file such as `.env.local`. Store deployed secrets in Vercel or the relevant managed secret store.
- Prefix a variable with `NEXT_PUBLIC_` only when it is intentionally safe for every browser user.
- The Supabase service-role key is server-only and must never be imported by client-reachable code.
- Fail fast with a clear server-side configuration error when a required variable is missing. Do not print secret values.
- Supabase values will be provided later. Vercel configuration waits until deployment.

## UI architecture and responsive design

- Build reusable components around stable behavior, not one-off screenshots.
- Reuse the same Gallery card renderer for the live gallery and Gallery Settings preview when practical.
- Keep `PresetArtwork` semantic: accept a stable preset key, size, and variant. Do not couple Collection cards to artwork filenames or dimensions.
- Use a top navigation. Do not add a persistent sidebar or bottom tab bar.
- Use dedicated pages for the two-step Collection wizard and Item Add, Edit, and Details flows.
- Use a dedicated Collection Settings page. Gallery Settings is a desktop right sheet and a mobile full-screen view.
- Responsive behavior must change composition, not merely shrink desktop pixels.
- Test widths 320, 375, 640, 768, 1024, and 1440 px.
- Prevent horizontal overflow at 320 and 375 px.
- Honor the approved mobile, tablet, and desktop grid behavior. A saved gallery column preference must not force overflow.
- A one-column gallery is a horizontal list card, with image left and details right.
- Mobile forms stack with image first. Inputs use at least 16 px text. Safe areas and the software keyboard must not cover the final field, error, or Save action.
- Sticky actions must never cover content.
- Browse tabs scroll horizontally on narrow screens and remain keyboard accessible.
- Reserve image aspect-ratio space to avoid layout shifts.

## Design tokens and typography

- Centralize colors, typography, spacing, radii, elevation, motion, breakpoints, and semantic states. Do not scatter raw design values through feature components.
- Map tokens through Tailwind and shadcn/ui theme variables where possible.
- Use the approved warm neutral base and muted pastel palette from the UX specification.
- Use semantic tokens for background, surface, foreground, muted foreground, border, focus, destructive, error, success, disabled, and selection states.
- Verify contrast; do not assume a proposed pastel or muted color is accessible.
- Use Plus Jakarta Sans for English UI and a fallback stack that safely renders Unicode content. Include Noto Sans Thai support when Thai content is rendered.
- Maintain the approved type hierarchy and 4 px spacing scale.
- Use restrained shadows and motion. Respect `prefers-reduced-motion`.
- Do not use pale accent colors for small body text.

## Accessibility and interaction requirements

- Target WCAG 2.2 AA.
- Normal text must meet a 4.5:1 contrast target.
- All interactive elements must work with keyboard alone and show a visible focus state.
- Use practical minimum touch targets of 44 by 44 px and leave space between adjacent icon actions.
- Every icon-only action needs an accessible name.
- Associate labels, descriptions, and errors with their controls.
- Dialogs and sheets must manage focus, trap it where appropriate, close by documented controls, and return focus to the opener.
- Selection cannot rely on color alone. Preset selection uses a strong outline and check indicator.
- Drag and drop must always have keyboard and touch alternatives such as Move up and Move down.
- Loading, empty, no-results, validation, unauthorized, not-found, server-error, and retry states must be distinct.
- Disable repeat submission while saving. Preserve safe form state after server or upload errors.
- Destructive confirmations must state exact consequences. Collection deletion requires typing its name when it contains Items.
- Details OFF in the gallery hides every text label, including Title.
- Do not disclose whether an unauthorized resource exists.

## Domain invariants

- Title is a required built-in Item property and cannot be deleted.
- Description is an optional built-in Item property.
- Supported custom types are exactly Text, Number, Date, Rating from 1 to 5, single Select, and URL.
- A Collection is not nested in another Collection.
- There is no physical folder entity. Browse folders derive from Select options and include Uncategorized for null or missing values.
- Stable IDs, not names, preserve field values, option membership, gallery configuration, and Browse state across renames.
- Gallery visible fields may include built-in Title, built-in Description, and eligible custom fields, with a combined maximum of three unique ordered fields.
- Each Collection has one saved gallery configuration shared by All and every filtered folder.
- Gallery settings edit a draft. Save commits; Cancel discards. Closing a changed Gallery Settings draft requires confirmation.
- Canceling a changed Create Collection wizard requires confirmation. Broader unsaved-route and browser-close prompts remain P1.
- Hard delete is permanent. Do not imply trash or undo.

## Error handling and observability

- Handle expected domain errors explicitly and close to their owning feature.
- Log server failures with structured context such as operation and safe record IDs, but never secrets, passwords, signed URLs, or private user content unless essential and approved.
- Give users actionable, non-technical errors and a retry path where recovery is possible.
- Preserve entered data after recoverable failures.
- Treat cleanup failure, authorization failure, validation failure, not found, conflict or stale data, and infrastructure failure as distinct categories.
- The shared demo may use disclosed last-write-wins. Refresh gracefully when stale records disappear or change.
- Do not swallow exceptions or return success before all required durable work has been accounted for.

## Testing and verification

- Every task must add or update tests proportional to its risk.
- Prefer unit tests for pure validation, mapping, configuration sanitization, and domain behavior.
- Add integration tests for Server Actions, database behavior, RLS, Storage authorization, cleanup handling, and current-schema validation.
- Add end-to-end tests for critical user journeys: auth, protected routes, Collection creation, schema editing, Item CRUD, images, Browse by, gallery settings, deletion, and persistence after refresh.
- Test direct unauthorized IDs and calls, not only hidden UI controls.
- Test two-account isolation and two simultaneous sessions of the shared demo account.
- Test gallery columns 1 through 5, all five ratios, cover and contain, details OFF, visible-field cap and order, spacing, sorting, Save, and Cancel.
- Test renamed and deleted fields and options, Uncategorized behavior, and stale Browse query parameters.
- Test image upload, replace, remove, unauthorized access, invalid type, oversize file, database failure, and cleanup failure.
- Perform keyboard-only, focus, reduced-motion, contrast, touch-target, and responsive passes at the required viewport widths.
- Run the repository's formatter, lint, typecheck, unit tests, relevant integration or end-to-end tests, and production build before declaring a task complete. If a check is unavailable, record why in the task tracker and report it.

## Coding quality

- Optimize for clarity, explicit contracts, and maintainable feature boundaries.
- Use names from the approved domain language: Library, Collection, Item, Field Definition, Select Option, Browse by, virtual folder, gallery configuration, and Uncategorized.
- Avoid duplicate business rules. Put validation and normalization in the owning feature and reuse it from UI and server boundaries where safe.
- Keep components focused. Separate data loading, mutation, state coordination, and presentation when they become difficult to test independently.
- Comments explain non-obvious reasons or constraints, not code that is already self-explanatory.
- Remove dead code, debug output, and temporary bypasses before committing.
- Do not suppress lint, type, security, or accessibility errors without a documented reason and approval when the suppression weakens a requirement.
- Do not make unrelated refactors in an atomic feature task.

## Task tracker

- Use `docs/tasks.md` as the repository task tracker unless the user explicitly selects an external tracker.
- Every implementation task must define scope, requirement references, acceptance criteria, verification commands, status, and resulting commit hash.
- Break work into atomic, independently verifiable tasks. A task should produce one coherent behavior or foundation and one logical commit.
- Mark a task complete only after verification passes and the commit exists.
- Update the task tracker as part of the same commit as the code and tests it describes. Never make a separate bookkeeping-only completion commit.
- If new work is discovered, add a new task rather than silently expanding the current task.

## Required task workflow

For every application-development task:

1. Read `AGENTS.md`, the relevant specifications, approved decisions, and current task entry.
2. Inspect the current repository state and existing patterns.
3. Restate the atomic task boundary and acceptance criteria before editing.
4. Implement only that task, including tests and necessary documentation.
5. Run relevant formatting, lint, typecheck, tests, security checks, and build verification.
6. Update `docs/tasks.md` with the actual outcome and verification results.
7. Review the diff for secrets, unrelated changes, generated noise, and requirement drift.
8. Create one logical Git commit using the rules below.
9. Report the commit hash, summary, and verification performed.
10. Stop and wait for explicit approval before starting another task.

Do not combine multiple atomic tasks merely to reduce the number of commits. Do not continue automatically after reporting a task commit.

## Git rules

- One atomic task equals one logical Git commit.
- Use Conventional Commits, for example `feat(collections): add preset selection` or `test(auth): verify protected routes`.
- Every commit must include a bullet-point body describing the changes actually included. A subject-only commit is not allowed.
- Use an imperative, specific subject. Do not claim broader work than the diff contains.
- Run all relevant verification checks before committing.
- Update `docs/tasks.md` as part of the same commit.
- Never commit broken code, failing tests, secrets, populated environment files, credentials, signed URLs, or debug artifacts.
- Inspect staged changes before committing.
- Do not amend, rebase, squash, reset, force-push, or otherwise rewrite previous commits without explicit approval.
- Do not push any branch or tag unless explicitly authorized.
- Do not commit directly to a protected branch when the repository workflow requires a task branch.
- Do not create a commit if unrelated user changes are mixed into the task and cannot be safely separated. Stop and report the overlap.
- After each task, report the commit hash and stop for approval.

Required commit form:

```text
<type>(<scope>): <imperative summary>

- <actual change one>
- <actual change two>
- <verification or documentation change when applicable>
```

## Stop conditions

Stop and ask for direction when:

- a task conflicts with a confirmed requirement or approved decision;
- completing it would add a P1 or P2 feature without explicit promotion;
- a security or RLS rule is unclear;
- required secrets or external access are missing;
- destructive Git history changes or a push would be required without authorization;
- unrelated local changes overlap the task;
- relevant verification fails and cannot be fixed within the atomic task;
- the task is complete and its commit hash has been reported.

Do not start application development merely because this file exists. Development begins only after the user approves the documentation and assigns the first atomic task.
