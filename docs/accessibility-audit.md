# M7-T02 accessibility and responsive audit

Code/component audit on 30 October 2026, after the DESIGN.md restyle and preset draft editor. Functional authority remains the original Product/Technical and UX specifications, approved decisions C11/B06/B07, and AGENTS.md. The [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) supplement these sources; they do not override the approved scope, sentence case, or deferred unsaved-navigation prompts.

## Confirmed code defects addressed

- Added a first keyboard stop, Skip to content, and a common focusable main landmark on protected, Auth, loading, error and unavailable pages. The link works as a native anchor without JavaScript.
- Shared dialogs now cap height against the dynamic viewport, scroll overflowing content, contain overscroll and wrap long names. Gallery Settings explicitly retains its full-height sheet override; Field editors retain their existing mobile full-screen form factor.
- Shared page/header gutters and full-screen panels account for safe-area insets. Viewport fit covers notched displays without restricting zoom. Actual notch/keyboard behavior still needs device verification.
- Removed the wizard's sticky action rows so they cannot overlay the long draft editor or its focused inputs. Actions remain in normal document flow and retain pending guards.
- Native inputs/selects can shrink within narrow grid columns. Labels, legends and headings wrap long Unicode content. Root scroll padding provides clearance beneath the shared sticky header.
- The header and skip link clear the top safe area; absolute close controls in full-screen panels use top/right safe offsets. Item actions also use normal document flow. The root unmatched-route page preserves the skip target, and the draft checkbox's accessible name contains its visible label for voice input.

## Coverage and evidence

| Area                                    | Code/component evidence                                                                                                                                                        | Remaining browser evidence                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Auth and protected shell                | Shared skip target; labelled email/password inputs, autocomplete, adjacent errors, first-error focus, native disclosure account control                                        | Actual skip-anchor focus/scroll, zoom, mobile keyboard                       |
| Library and preset selection            | Named links/buttons, selected check plus aria-pressed, responsive grids, semantic artwork, long-name wrapping                                                                  | Visual clipping and card focus at each width                                 |
| Creation draft and Field/Option editors | A/AA axe checks on populated draft; labels/error references, required semantics, ordered headings, 44 px wrapping label targets, keyboard reorder alternatives, pending guards | Long lists, screen-reader announcements, mobile keyboard and touch           |
| Browse and gallery                      | Named links with aria-current; keyboard activation, existing responsive column/ratio/config tests; reserved image geometry                                                     | Actual horizontal Browse scrolling, reflow and visual layout shifts          |
| Gallery Settings                        | Open-sheet A/AA axe check; labelled controls; existing Save/Cancel/discard, focus and pending tests; constrained sheet and contained inner scrolling                           | Actual sheet geometry, nested-dialog focus and software keyboard             |
| Item Add/Edit/Details and images        | Labelled dynamic controls, custom errors and bad-input retention, native control shrinkage, image placeholders/retry, locale-aware values, normal-flow actions                 | Native date/number rendering, image fitting and keyboard visibility          |
| Confirmations and recovery              | Existing keyboard Escape, focus trap/return and pending-dismissal tests; bounded scrollable dialog; explicit permanent consequences; distinct retryable errors                 | Long confirmation names in short/zoomed viewports                            |
| Shared tokens and motion                | Unit contrast checks for normal/state text and control outlines; 44 px touch-target foundation; reduced-motion CSS; stable scrollbar gutter                                    | Rendered contrast, actual target geometry and reduced-motion device behavior |

Axe runs here use jsdom and WCAG A/AA tags through 2.2. Rendered color contrast is excluded from axe and covered by token contrast calculations. The rendered-label comparison rule is excluded because it calls an unavailable canvas text-measurement API; an explicit visible/accessible checkbox-name regression is included, and full rendered-label/voice-input validation remains in the browser checklist. These component checks do not constitute browser accessibility certification.

## Required viewport matrix

The following are code-derived layout expectations with zero safe-area insets, not rendered measurements. Header and page use the same centered outer container and gutters; gallery preferences are capped by container queries.

| Viewport px | Available wide content px | Library columns | Maximum gallery columns | Browser checked |
| ----------- | ------------------------- | --------------- | ----------------------- | --------------- |
| 320         | 288                       | 1               | 1                       | No              |
| 375         | 343                       | 2               | 2                       | No              |
| 640         | 592                       | 2               | 2                       | No              |
| 768         | 720                       | 3               | 3                       | No              |
| 1024        | 960                       | 3               | 4                       | No              |
| 1440        | 1136                      | 4               | 5                       | No              |

## Remaining acceptance work

The user explicitly excludes browser testing. M7-T02 therefore remains **In progress**, with code fixes and available checks completed in this commit. Do not mark it complete merely because component tests pass.

- Check all six widths for horizontal overflow, clipped actions, long Unicode names, form errors and image layout.
- Exercise keyboard-only navigation, real skip-link focus/scroll, account disclosures, Browse links, dialogs, nested discard confirmation and focus return.
- Check software keyboard obstruction, safe areas, touch targets, zoom, reduced motion and scrollbar/scroll-lock stability on actual browser/device layouts.
- Run the browser accessibility pass or record user-supplied manual evidence before closing the original conformance task.

No browser was opened and no hosted data was modified for this audit. Product features and backend contracts are unchanged.
