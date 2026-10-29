# Design System

## Direction

The MVP uses soft playful minimalism with editorial restraint: a warm neutral canvas, white surfaces, dark readable text, rounded geometry, muted pastel artwork, generous whitespace, and restrained elevation. Item imagery carries content; controls remain quiet and legible. Avoid decorative gradients, heavy card shadows, 3D artwork, and ornamental CRUD forms.

The branded product name is **little things.** MVP interface copy is English. User content supports Unicode, including Thai. Use Plus Jakarta Sans for English and a Noto Sans Thai-capable fallback.

## Token contract

Tokens must be centralized as CSS variables and mapped through Tailwind/shadcn semantic names. Feature components must not duplicate raw values.

### Core colors

| Token              | Value     | Use                                                                   |
| ------------------ | --------- | --------------------------------------------------------------------- |
| `background`       | `#F6F5F3` | Page canvas                                                           |
| `surface`          | `#FFFFFF` | Cards, sheets, dialogs, inputs                                        |
| `surface-muted`    | `#EEEDEA` | Secondary surfaces and subtle controls                                |
| `foreground`       | `#242424` | Main text and primary actions                                         |
| `foreground-muted` | `#6B6B6B` | Supporting copy; adjusted to pass AA on all approved neutral surfaces |
| `border`           | `#E5E3DF` | Decorative card outlines and separators                               |
| `control-border`   | `#8F8A84` | Input and outlined-control boundaries                                 |
| `art-lavender`     | `#E6E0F4` | Books and selected artwork                                            |
| `art-sage`         | `#DCEBDD` | Meals                                                                 |
| `art-peach`        | `#F5E1D6` | Warm category artwork                                                 |
| `art-butter`       | `#F5EAC8` | Travel                                                                |
| `art-sky`          | `#DCEAF4` | Movies                                                                |
| `art-rose`         | `#F2DDE6` | Favorites                                                             |
| `art-sand`         | `#EAE1D4` | Shopping                                                              |
| `art-mint`         | `#DCEDE8` | Additional presets                                                    |

### Semantic state colors

| Token                 | Initial value | Use                                                        |
| --------------------- | ------------- | ---------------------------------------------------------- |
| `focus`               | `#4F46E5`     | Focus ring on light surfaces                               |
| `destructive`         | `#B42318`     | Destructive actions and critical error text                |
| `error`               | `#B42318`     | Validation and failure text                                |
| `success`             | `#067647`     | Success text and status                                    |
| `selection-border`    | `#3B315F`     | Selected preset/card outline                               |
| `disabled-surface`    | `#E5E3DF`     | Disabled control background                                |
| `disabled-foreground` | `#737373`     | Disabled label; never used for required instructional text |

M0-T03 must verify these values in context and may adjust them only to meet contrast while preserving their semantic role. Do not use pastel artwork colors as small text colors.

### Contrast audit

The implementation audit adjusted `foreground-muted` from the proposed `#737373` to `#6B6B6B`. The original value measured 4.35:1 on the warm page background and 4.05:1 on the muted surface, below the 4.5:1 normal-text target. It also introduced `control-border` for interactive boundaries because the subtle decorative border does not meet the 3:1 non-text contrast target. The approved visual direction remains unchanged.

| Pair                              | Ratio   | Result                     |
| --------------------------------- | ------- | -------------------------- |
| Foreground on background          | 14.25:1 | Pass AA and AAA            |
| Foreground on surface             | 15.52:1 | Pass AA and AAA            |
| Muted foreground on background    | 4.89:1  | Pass AA                    |
| Muted foreground on surface       | 5.33:1  | Pass AA                    |
| Muted foreground on muted surface | 4.55:1  | Pass AA                    |
| Error on surface                  | 6.57:1  | Pass AA                    |
| Success on surface                | 5.69:1  | Pass AA                    |
| Focus indicator on background     | 5.77:1  | Pass 3:1 non-text contrast |
| Control border on background      | 3.14:1  | Pass 3:1 non-text contrast |
| Control border on surface         | 3.42:1  | Pass 3:1 non-text contrast |

### Typography

| Role          | Desktop           | Mobile        |
| ------------- | ----------------- | ------------- |
| Display       | 40–48 px, 600–700 | 30–34 px      |
| Page title    | 30–36 px, 600     | 26–30 px      |
| Section title | 22–24 px, 600     | 20–22 px      |
| Card title    | 16–18 px, 600     | 15–16 px      |
| Body          | 15–16 px, 400     | 14–16 px      |
| Form input    | 16 px minimum     | 16 px minimum |
| Label         | 13–14 px, 500     | 13–14 px      |
| Caption       | 12–13 px          | 12–13 px      |

Use logical heading order. Visual size does not change semantic heading level.

### Spacing radius and elevation

- Base spacing unit: 4 px.
- Approved spacing steps: 4, 8, 12, 16, 24, 32, and 48 px.
- Surface radii: 12, 16, and 24 px. Pills use 999 px.
- Use small shadows for selected floating cards, medium for sheets, and large only for dialogs. Gallery cards do not receive a heavy shadow by default.
- Minimum interactive target: 44×44 px. Mobile primary actions may be 48–52 px high.

### Motion

| Interaction     | Standard                    | Reduced motion           |
| --------------- | --------------------------- | ------------------------ |
| Card hover      | translate Y -2 px, 150 ms   | no translation           |
| Button feedback | color/border, 150 ms        | immediate                |
| Dialog          | fade/scale, 180 ms          | immediate or subtle fade |
| Sheet           | slide, 220 ms               | no slide                 |
| Selection       | border/background, 120 ms   | immediate                |
| Gallery reflow  | 180–240 ms when performant  | immediate                |
| Image load      | reserved skeleton then fade | no fade                  |

## Responsive foundations

| Dimension        | Mobile under 640     | Tablet 640–1023      | Desktop 1024 and wider        |
| ---------------- | -------------------- | -------------------- | ----------------------------- |
| Page padding     | 16–20 px             | 24–32 px             | 32–48 px                      |
| Container        | full available width | centered             | centered, max 1200–1280 px    |
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

### PresetArtwork

- Props: semantic preset key, size, and variant.
- Resolves Lucide icon and pastel token internally.
- Decorative instances are hidden from assistive technology; meaningful instances receive an accessible label outside the artwork.
- Never expose image filenames or fixed Collection-card dimensions.

### Buttons and links

- Primary button is a dark rounded control with visible hover, focus, pressed, disabled, and submitting states.
- Link text must remain distinguishable without relying only on color.
- Icon-only buttons require accessible names and tooltips where meaning is not obvious.

### Inputs

- Label above control, associated programmatically.
- Support helper, required, error, disabled, and loading states.
- Error text is adjacent and referenced by the control.
- On submit failure, focus or scroll to the first invalid control.

### Cards

- Collection card: Option C artwork, name, Item count, overflow actions.
- Preset card: artwork, label, selected outline, and check indicator.
- Folder card: Option C artwork, option label, and count, including zero.
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

- Target WCAG 2.2 AA and 4.5:1 contrast for normal text.
- All workflows operate with keyboard alone.
- Reordering always has Move up/down alternatives.
- Focus is visible and follows logical reading order.
- Touch targets are at least 44×44 px with separation.
- Selection never relies on color alone.
- Respect `prefers-reduced-motion`.
- Safe areas and software keyboards do not cover the last control, errors, or Save.
- Reserve image dimensions to limit unexpected layout shift.
