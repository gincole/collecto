# M7-T02H: Page spacing and dropdown switching

## Scope and acceptance

The user requested twice the bottom gap on every page and one-click switching
between dropdown controls with animation. This continues M7-T02G without changing
modal URLs, domain rules or data behavior. References: DESIGN.md token/motion
direction, original UX/UI specification shared controls and accessibility, and
the existing M7-T02G local modal/fixed-footer contract.

- Shared PageContainer and AuthShell retain 32 px mobile / 48 px desktop top
  padding. Bottom padding becomes 64 px / 96 px, respecting the bottom safe area.
  Loading, error, not-found and Item pages inherit the same spacing. Modal bodies
  and fixed footers retain their current spacing.
- Clicking another Select or action-menu trigger closes the previous popup and
  opens the new one with that click, including inside dialogs.
- Popup entry/exit uses shared 150 ms opacity/4 px movement/0.98 scale motion.
  Reduced motion follows the existing global suppression. Exiting popups are
  inert and hidden from assistive technology while their animation completes.
- Keyboard navigation, selected option focus, Escape, value serialization,
  disabled options, focus return, validation and parent-dialog focus remain intact.

## Implementation

The prior Radix Select locks outside pointer interaction. Select now uses the
existing shared nonmodal Radix Dropdown Menu behavior with combobox/listbox/option
roles and explicit selected state. It retains the option-based feature API and
controlled hidden form value. No custom global event bus or replayed clicks are
needed. Remove the unused Select dependency.

Menus inside dialogs portal into their owning dialog and use it as a collision
boundary. This keeps the menu within the parent focus scope and avoids conflicts
between differently versioned Radix focus primitives. Other menus portal to the
document as before. Dialog refs continue to be forwarded.

The shared page-block-space utility centralizes vertical page padding. Shared
popup CSS owns entry/exit states; Radix Presence keeps closed content mounted only
for its exit animation.

## Verification

Component regressions reproduce the previous switching/spacing failures and cover
one-click Select switching in a dialog, action-menu/Select switching, selected
values, keyboard selection, focus return, open-popup axe checks and spacing/motion
contracts. Run the full unit/component suite, formatter, ESLint, TypeScript,
dependency audit and production build. Inspect emitted CSS for the spacing and
animation rules. No browser or database checks are needed for this UI-only task;
rendered/device acceptance remains open under the user's no-browser instruction.

Final result: 334 tests across 50 files pass, including open-popup axe and exit
Presence lifecycle coverage. Formatting, lint, strict TypeScript, production audit,
configured build and generated spacing/animation CSS inspection pass. Independent
review found ArrowUp/collapsed-typeahead and popup-label references to preserve;
both were corrected and covered by regressions before committing. No remaining
actionable review findings. Concurrent branding edits were excluded.
