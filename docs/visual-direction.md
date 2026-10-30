# Approved visual direction — 30 October 2026

The user explicitly requested applying the newly added root `DESIGN.md` across the existing project. Its current reference is **Awesomic**, not the earlier untracked ElevenLabs draft. This instruction supersedes the original UX specification's pastel palette, Plus Jakarta Sans, surface geometry, and elevation defaults. It does not change the Product and Technical Specification's behavior or MVP scope.

## Application mapping

- Use the reference's zinc canvas `#f4f4f5`, white surfaces, `#fafafa` recessed surfaces, obsidian actions `#09090b`, and steel supporting text `#52525b`.
- Use DM Sans, the reference's explicitly permitted Cosmica substitute. No Cosmica assets were provided. Retain Noto Sans Thai as a script fallback, rather than losing Unicode content support.
- Map display/page/section/card/body/caption roles to the reference hierarchy. Use 64 px Library display headings on desktop, 40 px page headings, 32 px section headings, and 20 px card headings. Scale down on narrow screens; form inputs remain at least 16 px.
- Compact destructive/discard confirmation titles use the reference's 20 px subheading role consistently; larger Field and Gallery editors use responsive 24/32 px section headings.
- Use 36 px content cards, 14 px buttons/inputs, 12 px badges, 40 px artwork tiles, and pill navigation. Keep full-screen sheets edge-to-edge and preserve native control semantics.
- Use a centered 1200 px outer page container, 28 px desktop panel padding, and 80 px major Library section rhythm. Compact forms and dense galleries retain task-appropriate spacing; mobile panels use 16–20 px padding.
- Remove content-card drop shadows. Keep restrained elevation for floating menus, sheets, and dialogs. Primary buttons use a subtle inset highlight and dark border.
- Keep Lucide preset icons and stable preset keys; map their legacy pastel-named color tokens to zinc neutrals. These are functional category identifiers, not new decorative imagery. Keep private Item photographs in color, without overlays or duotone treatment.
- Orange is reserved by the reference for credential/category highlight badges. The current application has no credential badges, so do not invent promotional chips or apply orange to general controls. Do not introduce magenta decoration.
- Preserve red destructive/error semantics and green success semantics as safety/accessibility exceptions to the neutral brand palette. Focus and selection use dark zinc, with outlines/checks and text rather than color alone. Decorative hairline borders remain separate from contrast-compliant interactive boundaries.
- Preserve existing routes, CRUD, Field semantics, gallery configuration, privacy, pending feedback, and confirmation behavior. Do not add marketing heroes, social proof, signup capture, or other functionality illustrated by the reference website.

## Verification boundary

M7-T02C applies this mapping across shared primitives, Auth, Library, Collection setup/settings, Browse, gallery/live preview, Field/Option editors, Item forms/details, dialogs, feedback, and loading/error/empty states. Token/contrast and component tests verify contracts; formatter, lint, TypeScript, dependency audit, and production build verify integration. Browser/viewport testing remains excluded by the user's instruction, so this task does not close the full M7-T02 visual/accessibility acceptance audit.
