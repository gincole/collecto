# Design-system audit — 30 October 2026

M7-T02AE implements the user's request for a closer type scale, more restrained
corners, consistent name truncation and a mobile control review. All TSX files in
`app`, `components` and `features` were scanned for typography, radius, text overflow
and native controls; shared primitives and route/feature presentation were traced
through Auth, Library, Collection setup/settings, Browse, Gallery, Item forms and
details, Field/Option editors, feedback, empty/error/loading states and dialogs.
This is a code/component audit, not a rendered device or browser review.

## Confirmed findings and corrections

| Area          | Finding                                                                                          | Correction                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Shared type   | Large display/page gaps; raw text-sm/base and modal overrides diverged                           | One responsive type source, with aliases for existing role classes and UI text                                                 |
| Shape         | 36 px cards/dialogs and 40 px artwork corners overwhelmed smaller surfaces                       | Cards 20/16 px, dialogs 24/20 px, artwork 20/16 px (desktop/mobile); 14 px controls retained                                   |
| Names         | Collection, folder and Item headings wrapped/clamped differently; some labels could push actions | Shared DisplayName presenter plus constrained labels/dialog titles; single-line ellipsis, full DOM text and title where useful |
| Date control  | Native date control had only generic min-height/width classes                                    | Shared native-date bounds and fixed 44 px date height; WebKit value/edit minimum-size constraints                              |
| Inputs        | Reducing every font would shrink editable input text below the project minimum                   | Input/textarea/select trigger role stays 16 px; body/UI text uses the compact scale                                            |
| Mobile weight | Large preset icon tiles remained the desktop size                                                | Responsive artwork sizes, with desktop sizes preserved                                                                         |
| Supporting UI | Tiny empty-state icon surfaces used large content-card corners                                   | Shared control radius on small icon surfaces                                                                                   |

## Current role scale

| Role                                | Desktop px | Mobile px |
| ----------------------------------- | ---------: | --------: |
| Display                             |         36 |        28 |
| Page title                          |         28 |        24 |
| Section title                       |         20 |        16 |
| Card title                          |         18 |        14 |
| Modal title                         |         22 |        18 |
| Body                                |         14 |        13 |
| Supporting text / label             |         13 |        12 |
| Button/menu text                    |         14 |        12 |
| Caption                             |         12 |        11 |
| Editable inputs and select triggers |         16 |        16 |

Touch targets remain at least 44 px. Navigation pills, circular semantic icons,
prose wrapping, exact-name deletion instructions, normal editor scrolling and reduced-motion behavior are deliberate
role distinctions, not inconsistent copies. Truncation changes presentation only;
values, accessible text, editing, validation, persistence and private data handling
are preserved. Item descriptions, explanatory prose and the exact server-current
Collection name required by deletion confirmation continue to wrap so touch
users can read the value they must type.

## Verification boundary

All 386 tests across 56 files passed, including token/contrast tests, semantic
font-size/color merging, name/date component regressions and long Collection heading
coverage, existing route/modal/axe tests, strict TypeScript and production CSS
verification cover the implementation. Final section-role checks and build passed;
compiled CSS confirms the responsive aliases, native date rules and fixed input
type size. The native date picker and actual mobile
geometry still require the user's device check; browser tests remain excluded by
request. This does not close earlier rendered/mobile release acceptance work.

The separately approved five-column mobile behavior remains queued as M7-T02AD;
this audit does not alter gallery column preferences or responsive count rules.

Audit reference: [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines).
The application's approved decisions take precedence over generic guidelines.
