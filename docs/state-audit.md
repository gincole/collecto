# M7-T01 application state audit

Audited on 30 October 2026 against the Product and Technical Specification, UX/UI Specification state matrix, approved B06/B07/B10/B11 decisions, and the user's manual-test feedback. This task improves the existing flows. It does not claim browser or visual conformance; those checks remain excluded by the user's instruction.

| Surface                    | Loading, empty, and unavailable                                                                                           | Mutation and recovery feedback                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication and account | Existing auth loading/error boundaries and protected-route checks                                                         | Generic inline errors, submission labels, retained safe inputs; styled feedback for registration confirmation; allowlisted login/logout success notices                     |
| Library                    | Existing card skeletons, first-Collection CTA, and retry                                                                  | Collection deletion success notice describes scheduled image cleanup without claiming Storage atomicity                                                                     |
| Create Collection          | Dedicated form skeleton; preset/Blank selection and validation                                                            | Creating state blocks repeat submission and Cancel/preset changes; errors retain details; successful redirect announces creation and where to customize Fields              |
| Collection and Browse      | Existing reserved gallery skeletons, zero-count folders, Uncategorized, filtered-empty, safe stale-ID recovery, and retry | Item creation/deletion success notices; shared Gallery Settings remains available across views                                                                              |
| Item Add/Edit              | Dedicated image/form skeleton; consistent header/content width and back action                                            | Saving indication, repeat-submit guard, Cancel blocked while saving, highlighted-field summary, preserved values and file input on errors; success after redirect           |
| Item Details and images    | Explicit missing-image state; load failure is distinct and has a retry                                                    | Delete confirmation keeps errors visible and cannot dismiss during deletion; full-size action retained                                                                      |
| Collection Settings        | Dedicated skeleton, back action, retryable load error, safe unavailable page                                              | Styled saved/error messages; exact deletion copy and typed confirmation; pending dismissal blocked; non-shrinking Delete action                                             |
| Field and Option editors   | Existing built-in/custom distinction, empty state, and limits                                                             | Success/error announcements, structured recovery from thrown requests, focus/error retention, partial Select completion, destructive-impact retry, pending dismissal guards |
| Gallery Settings           | Existing real/sample preview and mobile/full-screen composition                                                           | Styled success/error messages, draft retention, Save guard, discard confirmation, stable-ID sanitization                                                                    |

## Shared presentation corrections

- Removed an unlayered `font: inherit` reset that overrode Tailwind control typography. Inputs retain a minimum 16 px font; labels and buttons use the existing type tokens.
- Shared buttons do not shrink in flex layouts. The Delete section's text can wrap, preserving the action label and icon.
- Collection setup, Settings, and Item pages use a 64 rem form container; gallery/Library retain the 80 rem content container and Auth retains its 27.5 rem card. These widths intentionally follow content roles. Form headings and content now align.
- Reused semantic surface, border, radius, error, and success tokens for image controls and feedback. Kept existing restrained transitions and reduced-motion support instead of adding decorative animation.
- M7-T02A replaces the original permanent notification region with a timed top toast, retaining live roles, manual dismissal, interaction pauses, and reduced-motion support. Inline errors remain next to the active form or dialog; successful Settings/Gallery saves no longer leave permanent banners.
- Redirect notices use fixed, allowlisted codes and are removed from the URL after consumption; arbitrary URL text is not rendered as feedback.

## Remaining work

- M7-T02A audits all seven form locations: Auth, Collection wizard, Collection identity, Collection deletion, Item Add/Edit, Item deletion, and Logout. They use `noValidate`; server validation and inline errors remain authoritative. There are no `window.alert`, `window.confirm`, or `window.prompt` calls in application code. Field/Option and Gallery editors use explicit action buttons rather than native form submission. All persisted delete actions now share the documented destructive-control contract.
- Item forms check native `validity.badInput` before serializing Number/Rating/Date controls. Unfinished input is retained for a custom inline error and cannot silently clear an optional saved value.
- Still missing: immediate pending feedback/skeletons for Browse query-parameter navigation. The existing Collection route skeleton does not establish coverage of those transitions. Investigate serial/redundant data reads without weakening ownership checks.
- Still missing: stable scrollbar gutter across short and long pages to avoid centered-header movement. These two reported gaps are M7-T02 work; they are not claimed fixed by M7-T01 or M7-T02A.

- M7-T01A: customize preset Fields before final Create. The current wizard is an explicitly described preview; adding editing requires a separate validated creation contract and atomic persistence tests. Persisted custom Field types remain immutable under B02.
- M7-T02: complete the cross-screen typography, spacing, focus, contrast, touch-target, and responsive conformance audit. Static/unit checks cannot establish final visual quality. User browser testing can supply additional evidence while automated browser testing remains excluded.
- M7-T03: complete the broader security and failure-path acceptance suite.

Verification is recorded in `docs/tasks.md`. No new dependencies, database migrations, or hosted writes are required for this task.
