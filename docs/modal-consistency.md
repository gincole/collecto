# M7-T02E: Modal navigation and shared controls

## Approved scope and authority

The user's 30 October 2026 request explicitly replaces the dedicated New Collection,
Add Item and Collection Settings pages and the Gallery Settings desktop sheet with
vertical modal flows. This supersedes those form factors in AGENTS.md, the Product &
Technical Specification, UX/UI Specification and Annotated Screen Designs. It does
not change domain rules, authorization, field types or persistence. Edit Item and
Item Details retain their existing routes and Back controls.

References: original specifications' navigation, Collection creation, Item form,
Collection Settings and Gallery Settings sections; ../docs/decisions.md B07/N07
(wizard cancellation); DESIGN.md and docs/visual-direction.md (shared tokens).

## Acceptance criteria

- New Collection, Add Item, Collection Settings and Gallery Settings share a bounded
  vertical modal with Back, a separately scrolling body and stationary footer.
- Existing URLs work directly and on refresh. In-app navigation intercepts the
  three route-backed flows above the current screen; Back restores that screen.
- Wizard and Gallery Settings retain dirty-draft confirmations. Pending operations
  prevent repeat submission and dismissal; errors retain editable drafts.
- Collection overflow contains icon-labelled Collection Settings, Gallery Settings
  and Delete. Gallery Settings no longer occupies the browse toolbar.
- Logo remains the Library link; redundant My Library navigation is removed.
  Auth and Library have Back controls; other existing page Back links remain.
- All Select and overflow controls use shared accessible Radix primitives, token
  colors, keyboard interaction and focus handling. Form Select values serialize
  once and survive recoverable action resets.
- Library and other loading placeholders use the shared Skeleton color.

## Implementation and verification

Next parallel/intercepted routes preserve the background and canonical URLs.
ModalActions portals footer controls out of the scrolling body; native form IDs
keep submit controls associated with their forms. Shared modal loading states use
the same skeleton primitive. Local Gallery Settings opens a fresh editor from the
current saved configuration and restores focus to the overflow trigger.

Pinned Radix Select and Dropdown Menu dependencies extend the existing Radix
foundation. Shared Select retains the current option-based feature API. Its trigger
is detached from automatic native resets because controlled drafts and structured
action errors own reset behavior; a controlled hidden input submits the real value.

Component regressions cover footer submission, direct/intercepted Back, pending and
dirty guards, shared Select serialization, draft preservation, menu actions and focus.
Run formatter, ESLint, strict TypeScript, Vitest, dependency audit and production
build. No database behavior changed, so database resets/API suites are unnecessary.
Browser, rendered layout and device checks remain excluded by user instruction;
the broader M7-T02 acceptance stays open.

Final local result: 319 Vitest tests across 46 files pass. Formatter, ESLint, strict
TypeScript, production dependency audit and configured production build pass.
Independent code review found draft reopening and focus-restoration issues; both
were fixed and covered by menu-to-modal component regressions before committing.
Concurrent user branding edits were preserved and excluded from the task commit.

## M7-T02F: Development route regression

The original root modal catch-all also matched login/register across route groups.
Next.js development strict matching then pruned those authentication pages, even
though the production build passed. The catch-all now applies only below
Collections, with an explicit empty Library modal route. Strict matching stays
enabled; no authentication or authorization behavior changes.

A regression scans the real app tree and calls the installed Next.js development
route validator, checks all pages remain reachable and verifies modal clearing
for Library and Collection navigation. It reproduces both unmatched auth pages
before the fix. Afterward, all 320 tests/47 files, formatting, lint, TypeScript and
production build pass; direct HTTP checks of login/register return 200 from the
existing development server. No browser testing was used.

## M7-T02G: Correct local modal behavior (supersedes route-backed flows)

The user clarified that Library has no Back action and all four form modals must
keep the current URL, open immediately using data already loaded by the parent
page, and dismiss using a top-right X, Escape or a backdrop click. This explicitly
supersedes M7-T02E route-backed modals and the earlier request for modal Back.
Wizard step navigation remains inside its footer; closing is distinct from going
to a previous step. Dirty wizard/gallery drafts still require confirmation and
saving blocks dismissal. Shared dialog controls follow the same X convention.

Use local controlled Radix dialogs, eager feature imports and the existing
authenticated Library/Collection payloads. No client cache, extra fetch-on-open,
route interception, URL query/hash state or modal navigation is needed. Existing
form URLs redirect to their parent for compatibility. Create actions return
structured success, close the dialog, notify and refresh the current page without
resetting Browse URL state. Collection deletion can still return to Library.

References: WAI-ARIA modal dialog pattern (visible dismiss control, Escape, focus
trap and restoration), Radix Dialog controlled state and outside interaction;
original specs and decisions retain domain/auth/data/dirty-confirmation authority.
Sources: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ and
https://www.radix-ui.com/primitives/docs/components/dialog .

Acceptance: no Home Back; no modal opening link or routing; data present at page
load; X/backdrop/Escape use the same guarded close; fixed footers and vertical
forms retained; focus returns to correct button, menu or empty-state trigger;
validation/pending/success recovery preserved. Verify component interactions,
Server Actions, real route topology, formatter, lint, types and production build.
No browser tests, hosted writes or unrelated branding changes.

Collection summaries use owner-scoped Item and filtered image aggregates, keeping
preloaded delete summaries accurate beyond the API row cap without fetching Item
content. SDK query-contract and mapping regressions cover aliases, ownership and
large counts. The local Docker/Supabase stack was unavailable, so the optional
live loopback query check could not run; no hosted query or data writes were made.

Final M7-T02G result: 328 Vitest tests across 49 files pass, including modal
interaction, Server Action success/error, concurrent busy sources, focus return,
preloaded schema/counts and real Next.js route topology. Formatter, lint, strict
TypeScript, configured production build and independent review pass. The review
count issue was resolved with aggregate queries. Shared X controls stay mounted
and disabled while saving to preserve focus order. Broader rendered/device
acceptance remains outside this task under the user no-browser instruction.
