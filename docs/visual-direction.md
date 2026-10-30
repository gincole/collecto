# Visual Direction

The Collecto interface applies the visual language in root `DESIGN.md` to a private collection-management product. The reference informs typography, color, geometry, spacing, and motion without introducing marketing-site sections or changing product behavior.

## Color and typography

- Use the zinc canvas `#f4f4f5`, white surfaces, `#fafafa` recessed surfaces, obsidian actions `#09090b`, and steel supporting text `#52525b`.
- Use DM Sans as the primary typeface and retain Noto Sans Thai as a script fallback.
- Use responsive type tokens for display, page, section, card, body, label, and caption roles.
- Keep editable controls at a minimum of 16 px text on small screens.
- Preserve semantic red for destructive and error states and semantic green for success states.
- Reserve orange for genuine credential or category highlights. Do not use it for general controls, links, or decoration.

## Shape and elevation

- Content cards use 20 px corners on larger screens and 16 px corners on small screens.
- Dialogs use 24 px corners on larger screens and 20 px corners on small screens.
- Buttons, inputs, and compact controls use 14 px corners.
- Badges use 12 px corners, while navigation pills may use fully rounded geometry.
- Content cards use hairline borders instead of drop shadows.
- Floating menus, sheets, and dialogs may use restrained elevation to preserve layering.
- Primary buttons use the dark action surface with a subtle inset highlight and border.

## Layout

- Use a centered outer page container with a maximum width of 1200 px.
- Use a maximum width of 1024 px for forms and a 440 px Auth card.
- Major Library sections use an 80 px desktop rhythm; compact forms use smaller semantic groups.
- Mobile panels use 16 to 20 px padding. Dialogs use 16 px mobile and 28 px desktop outer insets.
- Responsive composition must prevent horizontal overflow and preserve practical touch targets of at least 44 by 44 px.
- Displayed names may use a one-line ellipsis when space is constrained, while accessible labels and title attributes preserve the full value. Prose continues to wrap.

## Components

### Cards and artwork

Collection and folder cards share the same surface, border, radius, typography, and hover treatment. Preset artwork uses Lucide icons and stable semantic preset keys. Private Item photographs keep their original colors without decorative overlays or duotone effects.

### Forms and fields

Inputs, labels, help text, and validation messages use consistent type and spacing tokens. Native date controls retain platform semantics. Field and option ordering provides drag interaction plus keyboard and touch alternatives.

### Dialogs

All modal flows use the same header, scrollable body, and fixed footer structure. Header, body, and footer dividers align to the same inset. Dialogs retain an accessible title, X dismissal, Escape and backdrop behavior where safe, focus management, dirty-state protection, and pending-state guards.

Primary editor titles use the modal title role, section headings use the section role, and compact destructive confirmations use the smaller confirmation title role. Wizard steps appear directly in the header title area without duplicating the label in the body.

### Gallery

The live gallery and settings preview share presentation rules. Saved column preferences may be reduced by the available width to prevent overflow. One-column mode uses a horizontal card. Image aspect-ratio space is reserved before loading to reduce layout shift.

### Feedback and motion

Pending actions show immediate feedback and block duplicate submission. Success and error messages use semantic colors and accessible text. Motion is short and restrained, and every animation must respect `prefers-reduced-motion`.

## Accessibility boundary

Focus, selection, validation, and destructive states cannot rely on color alone. Every icon-only action requires an accessible name, dialogs return focus appropriately, and all critical interactions must work with a keyboard.

Automated component and accessibility tests help protect these contracts. They do not replace manual keyboard, zoom, screen-reader, rendered contrast, responsive-layout, and real-device testing.
