# Approved visual direction — 30 October 2026

The user explicitly requested applying the newly added root `DESIGN.md` across the existing project. Its current reference is **Awesomic**, not the earlier untracked ElevenLabs draft. This instruction supersedes the original UX specification's pastel palette, Plus Jakarta Sans, surface geometry, and elevation defaults. It does not change the Product and Technical Specification's behavior or MVP scope.

## Application mapping

- Use the reference's zinc canvas `#f4f4f5`, white surfaces, `#fafafa` recessed surfaces, obsidian actions `#09090b`, and steel supporting text `#52525b`.
- Use DM Sans, the reference's explicitly permitted Cosmica substitute. No Cosmica assets were provided. Retain Noto Sans Thai as a script fallback, rather than losing Unicode content support.
- Map display/page/section/card/body/caption roles to the reference hierarchy. Use 64 px Library display headings on desktop, 40 px page headings, 32 px section headings, and 20 px card headings. Scale down on narrow screens; form inputs remain at least 16 px.
- Compact destructive/discard confirmation titles use the reference's 20 px subheading role consistently. The M7-T02L modal refinement uses 24 px primary editor titles and 20 px section headings; page heading roles remain unchanged.
- Use 36 px content cards, 14 px buttons/inputs, 12 px badges, 40 px artwork tiles, and pill navigation. Keep full-screen sheets edge-to-edge and preserve native control semantics.
- Use a centered 1200 px outer page container, 28 px desktop panel padding, and 80 px major Library section rhythm. Compact forms and dense galleries retain task-appropriate spacing; mobile panels use 16–20 px padding.
- Remove content-card drop shadows. Keep restrained elevation for floating menus, sheets, and dialogs. Primary buttons use a subtle inset highlight and dark border.
- Keep Lucide preset icons and stable preset keys; map their legacy pastel-named color tokens to zinc neutrals. These are functional category identifiers, not new decorative imagery. Keep private Item photographs in color, without overlays or duotone treatment.
- Orange is reserved by the reference for credential/category highlight badges. The current application has no credential badges, so do not invent promotional chips or apply orange to general controls. Do not introduce magenta decoration.
- Preserve red destructive/error semantics and green success semantics as safety/accessibility exceptions to the neutral brand palette. Focus and selection use dark zinc, with outlines/checks and text rather than color alone. Decorative hairline borders remain separate from contrast-compliant interactive boundaries.
- Preserve existing routes, CRUD, Field semantics, gallery configuration, privacy, pending feedback, and confirmation behavior. Do not add marketing heroes, social proof, signup capture, or other functionality illustrated by the reference website.

## Verification boundary

M7-T02C applies this mapping across shared primitives, Auth, Library, Collection setup/settings, Browse, gallery/live preview, Field/Option editors, Item forms/details, dialogs, feedback, and loading/error/empty states. Token/contrast and component tests verify contracts; formatter, lint, TypeScript, dependency audit, and production build verify integration. Browser/viewport testing remains excluded by the user's instruction, so this task does not close the full M7-T02 visual/accessibility acceptance audit.

## Modal composition refinement — M7-T02L

The user's 30 October 2026 review replaces boxed form sections inside dialogs
with open, spaced groups, removes the shared modal header divider, and permits
an accessible but visually hidden shell title when the content already introduces
the screen (New Collection). Keep X dismissal and fixed footer actions.

Use the same existing typography tokens: 24 px primary modal/editor titles,
20 px modal section headings, and 20 px compact confirmation titles. Body text,
labels, input sizes and page typography retain their existing roles. Shared
`data-form-heading` and `data-form-panel` markers apply these rules within
`.dialog-content` only; page panels retain their layout. Field rows, inputs,
buttons, image controls and actual gallery-preview cards retain their boundaries.
Preset buttons center both their artwork and label. No interaction or persistence
contract changes.

## Modal chrome refinement — M7-T02S

The user's latest review restores header dividers, balanced header/footer padding,
section dividers and a larger scroll-end gap. This supersedes M7-T02L/M presentation
rules about divider removal and a zero-height wizard header. All modal families use
the same DialogHeader/Body/Footer with outlined Close controls. Wizard headers show
the small step label, while body heading sizes remain unchanged. Disabled buttons
keep their layout geometry with transparent borders and no shadow. The visible
Blank choice becomes a dark Custom card with Sparkles artwork; the `blank` data key
and empty schema remain unchanged. See implementation-plan M7-T02S for verification.

## Modal spacing and direct wizard header — M7-T02T

Restore a 16 px mobile / 28 px desktop outer panel inset in all dialogs, preserving
the inner body gutter and extra bottom scroll space. Header/footer margins match
the body padding so their dividers align with section dividers rather than the
outer modal edge; both include horizontal safe areas. Wizard steps are rendered
directly in the title slot with their existing small text size, with no portal or
duplicate body label. This refines M7-T02S without changing field/page behavior.

## Compact consistency pass — M7-T02AE

The user's subsequent review requests a tighter, more balanced scale, smaller
mobile typography, restrained radii, ellipsized displayed names and consistent
native date controls. This supersedes the earlier numeric type/radius mapping,
while retaining its palette, font family, control geometry and behavior.

See `docs/design-system-audit.md` for the full coverage and role matrix. Responsive
`--type-*` and `--shape-*` values now supply all shared utility aliases. Editable
controls retain the existing 16 px minimum, and all targets stay at least 44 px.
Cards use 20/16 px desktop/mobile corners, dialogs 24/20 px and controls 14 px.
Displayed names use one-line ellipses while preserving full text for accessibility;
prose continues to wrap. No browser/device visual acceptance is claimed.
