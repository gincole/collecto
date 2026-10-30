# Design System

## Direction

The current visual authority is root `DESIGN.md`, based on the Awesomic reference. See `docs/visual-direction.md` for its application mapping. The interface uses editorial zinc neutrals, a bold geometric type hierarchy, generous rounded cards, compact controls, and hairline borders.

DM Sans is the reference's approved substitute for unavailable Cosmica assets. Noto Sans Thai remains a script fallback. Item photographs retain their original colors. Preset icons retain semantic keys with neutral tile surfaces.

## Token contract

All values are centralized in app/globals.css and mapped through Tailwind semantic names. Reuse tokens across all features; do not introduce local brand palettes.

### Colors

| Token                    | Value              | Role                                          |
| ------------------------ | ------------------ | --------------------------------------------- |
| background               | #f4f4f5            | Zinc page canvas                              |
| surface                  | #ffffff            | Cards, inputs, dialogs                        |
| surface-muted            | #fafafa            | Recessed and secondary surfaces               |
| foreground               | #09090b            | Primary text and filled actions               |
| foreground-muted         | #52525b            | Supporting text and metadata                  |
| border                   | #ececee            | Decorative hairline outlines                  |
| control-border           | #71717a            | Accessible control boundaries                 |
| focus / selection-border | #18181b            | Focus and selected outlines                   |
| destructive / error      | #b42318            | Safety and validation semantics               |
| success                  | #067647            | Successful operation semantics                |
| disabled-surface         | #ececee            | Disabled controls                             |
| disabled-foreground      | #71717a            | Disabled labels                               |
| art-*                    | #ececee or #f4f4f5 | Neutral preset surfaces; legacy keys retained |

Semantic red/green are explicit safety exceptions to the achromatic brand palette. No generic orange buttons, links, text, or decorative magenta are added. The reference reserves orange for credential/category highlight badges; the application does not invent those badges.

Unit checks require normal and semantic text to meet 4.5:1 on supported neutral surfaces, and control boundaries to meet 3:1. Decorative borders are not used as the only indication of an interactive control. Selected presets retain both strong outline and check; Browse retains aria-current.

### Typography

| Role            | Desktop       | Mobile        | Weight |
| --------------- | ------------- | ------------- | ------ |
| Library display | 64 px / 1.12  | 40 px / 1.12  | 600    |
| Page title      | 40 px / 1.28  | 32 px / 1.2   | 600    |
| Section title   | 32 px / 1.28  | 24 px / 1.3   | 600    |
| Card title      | 20 px / 1.4   | 18 px / 1.4   | 600    |
| Body            | 15 px / 1.45  | 15 px / 1.45  | 400    |
| Controls        | 16 px minimum | 16 px minimum | 400    |
| Buttons         | 14 px         | 14 px         | 400    |
| Labels          | 14 px         | 14 px         | 500    |
| Caption         | 12 px / 1.64  | 12 px / 1.64  | 400    |

Visual sizes preserve logical heading levels. Long Unicode names wrap; text and controls remain usable on narrow screens.

### Geometry, spacing, elevation, and motion

- 4 px base scale; 28 px desktop panel padding, reduced to 16–20 px on mobile.
- 36 px content cards/dialogs, 14 px controls, 12 px badges, 40 px artwork tiles; pill navigation.
- 1200 px outer page container, 1024 px form container, and 440 px Auth card. Major Library sections use 80 px desktop spacing; compact forms retain shorter semantic groups.
- No content-card shadows. Primary actions have a subtle inset highlight; floating menus/sheets/dialogs retain restrained elevation.
- Skeletons use cloud-gray fills so they remain visible against both white cards and the zinc canvas.
- 44 px minimum touch targets; large primary actions may use 48 px. All text inputs remain at least 16 px.
- Stable root scrollbar gutter prevents centered content moving between short and long pages.
- Existing hover/selection/dialog/sheet/image transitions remain restrained and respect reduced motion. Toast timings and pending semantics remain unchanged.

## Responsive foundations

| Dimension        | Mobile under 640     | Tablet 640–1023      | Desktop 1024 and wider        |
| ---------------- | -------------------- | -------------------- | ----------------------------- |
| Page padding     | 16–20 px             | 24–32 px             | 32–48 px                      |
| Container        | full available width | centered             | centered, max 1200 px         |
| Global nav       | compact top header   | compact top header   | full top navigation           |
| Collection grid  | 1–2 columns          | 2–3 columns          | 3–4 or auto-fit at 240–260 px |
| Preset grid      | 2 columns            | 3 columns            | 4 columns where possible      |
| Gallery          | effective 1–2        | normally up to 3     | preferred 1–5                 |
| Item form        | image first, stacked | adaptive             | image left, fields right      |
| Item details     | stacked              | adaptive             | image and metadata columns    |
| Gallery Settings | full-screen          | sheet or full-screen | right sheet                   |
| Field editor     | full-screen          | adaptive             | inline or side panel          |
| Browse tabs      | horizontal scroll    | tabs                 | tabs plus actions             |

Test 320, 375, 640, 768, 1024, and 1440 px. Never allow a saved column preference to overflow its container. One-column gallery mode is horizontal: image left and details right.

## Shared component contracts

### AppHeader

- Brand left; My Library and account right on desktop.
- Compact mobile form; no permanent sidebar or bottom navigation.
- Account menu contains authenticated email and Logout only in P0.

### PageContainer

- Applies approved padding and max-width behavior.
- Never forces horizontal scrolling at 320 px.
- Use the 75 rem `page` token for Library/gallery, the 64 rem `form` token for Collection setup, Settings, and Item forms/details, and the existing 27.5 rem Auth card. Keep form headings aligned with their content; different content roles need not share one width.

### PresetArtwork

- Props: semantic preset key, size, and variant.
- Resolves Lucide icon and neutral token internally.
- Decorative instances are hidden from assistive technology; meaningful instances receive an accessible label outside the artwork.
- Never expose image filenames or fixed Collection-card dimensions.

### Buttons and links

- Primary button is a dark rounded control with visible hover, focus, pressed, disabled, and submitting states.
- Link text must remain distinguishable without relying only on color.
- Icon-only buttons require accessible names and tooltips where meaning is not obvious.

### Destructive actions and notifications

- Persisted deletion triggers use `DeleteButton`: Trash icon, visible Delete label, contextual accessible name, 44 px height, 14 px text, shared padding/radius, and outlined danger styling. Confirmation uses the same sizing with a filled danger surface and Delete permanently label. Pending/checking states disable the action. Collection/Item menus use `DeleteMenuLink` with matching icon, type, touch height, and danger color in the menu layout.
- Removing an unsaved draft option uses an X rather than a permanent-delete icon.
- Transient outcomes use one top-center toast host below the top navigation. Toasts enter/exit vertically, do not reflow the page, and dismiss after 4 seconds (success/info) or 6 seconds (error), with a 180 ms exit. Hover, keyboard focus, and window blur pause dismissal; reduced-motion rules suppress animation. Users can dismiss manually.
- Actionable field/form errors and blocking page errors remain inline until corrected or retried. They are not replaced by a disappearing toast. Forms use `noValidate` to avoid native validation popovers while retaining required/type semantics, server-side validation, error associations, and first-error focus.
- Toast interaction references: [Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast) and [Fluent 2 toast guidance](https://fluent2.microsoft.design/components/web/react/core/toast/usage). Timing and placement above are the project's selected implementation defaults.

### Inputs

- Label above control, associated programmatically.
- Support helper, required, error, disabled, and loading states.
- Error text is adjacent and referenced by the control.
- On submit failure, focus or scroll to the first invalid control.

### Cards

- Collection card: neutral Lucide artwork, name, Item count, overflow actions.
- Preset card: artwork, label, selected outline, and check indicator.
- Folder card: neutral Lucide artwork, option label, and count, including zero.
- Gallery card: reserved image area and optional ordered text. Details OFF means no text, including Title.
- Cards used as navigation must be keyboard operable with visible focus.

### Dialogs and sheets

- Trap focus where appropriate and return focus to the opener.
- Destructive dialogs state exact consequences.
- Populated Collection deletion requires exact typed name.
- Gallery Settings is a right sheet on desktop and full-screen on mobile; Save and Cancel remain reachable.

### Feedback and states

- Loading uses layout-preserving skeletons.
- Empty, filtered-empty, no-results where applicable, unauthorized, not-found, network error, and validation error are visually and semantically distinct.
- Error surfaces include a retry when recovery is possible.
- Toasts are brief, non-obstructive, and do not replace inline validation.

## Accessibility acceptance

- The root Skip to content link targets the focusable `main-content` landmark on normal, loading/error, Auth and unavailable routes.
- Shared dialogs bound and scroll long content within the dynamic viewport. Full-screen panels and their absolute close controls account for safe-area insets; page/header gutters and header clearance do too. Zoom remains enabled.
- Creation and Item actions stay in document flow rather than overlaying long forms. Root scroll padding clears the sticky header.
- Target WCAG 2.2 AA and 4.5:1 contrast for normal text.
- All workflows operate with keyboard alone.
- Reordering always has Move up/down alternatives.
- Focus is visible and follows logical reading order.
- Touch targets are at least 44×44 px with separation.
- Selection never relies on color alone.
- Respect `prefers-reduced-motion`.
- Safe areas and software keyboards do not cover the last control, errors, or Save.
- Reserve image dimensions to limit unexpected layout shift.

Passing component checks alone does not establish full accessibility conformance. Manual keyboard, zoom, screen-reader, contrast, responsive-layout, and real-device testing remain necessary.

### Async interaction feedback

Internal links use the shared NavigationLink and Next useLinkStatus progress feedback while destination route skeletons load. The root skeleton also covers initial session/layout work. Pending progress is portaled at the viewport top without affecting layout and respects reduced motion. Browse uses loaded data for immediate optimistic views, retains native modified links and validated URL navigation, and reconciles authoritative server props. It does not replace correct loaded content with artificial skeletons. Retries use Retrying labels and repeat-request guards; schema order/Option operations announce visible pending status. Private image renderers use the shared LoadingImage skeleton within a reserved aspect ratio until load or error, including cached images, replacements, and retry.
