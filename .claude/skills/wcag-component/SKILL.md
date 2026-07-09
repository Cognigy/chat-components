---
name: wcag-component
description: Build or modify accessible (WCAG 2.2 Level AA) components in @cognigy/chat-components. Use whenever creating or editing any React component, message renderer, button, link, dialog, datepicker, lightbox, gallery/carousel, audio/video control, adaptive card, or any JSX/markup — and whenever working on keyboard navigation, focus management, ARIA, screen-reader announcements, live regions, or aria-labels. Provides this repo's accessibility recipes, reference implementations, and a pre-finish self-check.
---

# Accessible chat-components (WCAG 2.2 AA)

Apply these recipes when writing or changing UI in `@cognigy/chat-components`. The goal is WCAG 2.2 Level AA on every rendered message and interactive surface. Reuse the existing reference implementations — do not reinvent them. `docs/accessibility.md` is the single source of truth for the gates and procedures referenced here.

## The standard

The normative requirement is the **[WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)** at **Level AA** (all A + AA success criteria). For a filterable, practical view of every criterion with sufficient techniques, use the **[How to Meet WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_customize&levels=aaa)** (filter to A & AA). WCAG defines _what_ must be true; the APG below defines _how_ to build each widget to satisfy it.

## Follow the W3C ARIA Authoring Practices Guide (APG)

When you build a recognizable widget, implement the **keyboard interaction and ARIA roles/states** exactly as the **[W3C ARIA APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/)** specifies. General conventions: Tab/Shift+Tab move between widgets (one tab stop per composite widget, via roving tabindex), arrow keys move _within_ a composite widget, `Esc` dismisses popups/dialogs, `Enter`/`Space` activate.

Key patterns for this library: [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (datepicker, lightbox), [Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (datepicker calendar), [Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) (gallery/swiper), [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/), [Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (event pills, live regions).

## Reference implementations & utilities (always prefer these)

| Need                                 | Use                                                                                                                                                                  | Path                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Find focusable children / focus trap | `getFocusableElements(el)` → `{ firstFocusable, lastFocusable, nextFocusable, prevFocusable }`                                                                       | `src/utils.ts`                             |
| Full dialog pattern                  | trigger `aria-expanded`/`aria-controls`/`aria-haspopup="dialog"`; `role="dialog"` + `aria-modal` + `aria-labelledby`; focus heading on open; trap; Esc; focus return | `src/messages/DatePicker/DatePicker.tsx`   |
| Lightweight dialog + Esc             | `role="dialog"` + `aria-label`, window-level Escape listener, labelled close button                                                                                  | `src/messages/Image/lightbox/Lightbox.tsx` |
| Screen-reader announcement text      | `getLiveRegionContent(messageType, data, config)`                                                                                                                    | `src/messages/live-region-helper.ts`       |
| Keyboard test helpers                | `pressKey`, `getTabbables`, `expectSingleTabStop`, `runAxe`, `expectNoA11yViolations`                                                                                | `test/a11y-utils.ts`                       |
| Reference interaction spec           | APG grid keyboard tests, roving tabindex, focus trap/return, no-double-announce                                                                                      | `test/DatepickerA11y.spec.tsx`             |

User-facing aria strings come from `config.settings.customTranslations.ariaLabels` — read them with a sensible fallback; never hardcode (see `closeDatePickerLabel` in `DatePicker.tsx` or `fullSizeImageViewerTitle` in `Lightbox.tsx`).

## Recipes by component type

### Buttons — [APG: Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

- Use the library wrappers `Button`/`PrimaryButton`/`SecondaryButton` (`src/common/Buttons`) — they render native `<button>` elements, and `eslint.a11y.config.js` maps them to `button` so jsx-a11y flags an icon-only wrapper without an accessible name exactly like a native one.
- Icon-only buttons need `aria-label` (from `customTranslations.ariaLabels`); mark the icon SVG `aria-hidden="true"`.

### Links & anchors — [APG: Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/)

- Real navigation → `<a href>` with `target="_blank"` + `rel="noopener noreferrer"` for external URLs. Sanitize URLs (the codebase uses `@braintree/sanitize-url`).
- Anchors must have content (`jsx-a11y/anchor-has-content`). Render-prop anchors (`ActionButton.tsx`, the markdown link override in `Text.tsx`) are the known false positives — if you hit the same pattern, add a justified disable (see below).

### Dialogs (datepicker, lightbox) — [APG: Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

Follow `src/messages/DatePicker/DatePicker.tsx`:

- Trigger button: `aria-haspopup="dialog"`, `aria-expanded={open}`, `aria-controls={dialogId}`, held in a ref for focus return.
- Dialog root: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at the heading (or `aria-label`, as in `Lightbox.tsx`).
- On open, focus the heading (`tabIndex={-1}` + `ref.focus()`) so the dialog name is announced.
- Trap focus with `getFocusableElements` on the dialog's keydown: Tab from last → first, Shift+Tab from first → last. Remember the programmatically-focused heading is NOT in `getFocusableElements()` output — trap Shift+Tab from it explicitly (see the comment in `DatePicker.tsx`).
- `Esc` closes; on close, restore focus to the trigger ref.

### Galleries / carousels — [APG: Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)

- Previous/next controls need accessible names (the a11y gate finds the gallery's "Next slide" button by label). Slides and their action buttons must stay keyboard reachable after navigation — the axe gate scans the gallery post-navigation state for exactly this reason.

### Live regions / announcements — [APG: Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)

- This library does not render the chat log's live region — Webchat does. This library **computes the announcement text**: `getLiveRegionContent` in `src/messages/live-region-helper.ts` switches on message type. **A new message type needs a branch there**, or it will render silently for screen-reader users.
- `ChatEvent` pills carry their own `aria-live="assertive"`; the helper returns an `IGNORE-` prefixed value for events so Webchat skips double-announcing.

### Images

- `alt` from the message data (`altText`); decorative or unnamed images render `aria-hidden="true"` — never an unnamed `role="img"` (that was the ListItem fix shipped in 0.77.0).

### Adaptive cards

- The `adaptivecards` renderer sets text via `element.innerText`, which jsdom doesn't implement — `test/setup.js` shims it onto `textContent` so the axe gate sees real accessible names. Don't remove that shim; don't set text via `innerText` in this repo's own code.

### Suppressing a jsx-a11y rule

Only for genuine false positives, and always with a `--` justification naming the accessible path:

```tsx
{
	/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-to-close
    backdrop is a pointer convenience; the keyboard path exists: the window-level
    Escape listener above closes the dialog and LightboxHeader renders a focusable
    close button. */
}
```

## Testing your work

- **New message type** → fixture JSON + one case entry in `test/fixtures/message-cases.ts`. That single entry feeds BOTH the axe gate (`test/a11y.spec.tsx`) and the DOM-compat gate (`test/dom-compat.spec.tsx`).
- **New interaction state** (dialog, navigation, expansion) → add a stateful axe scan to `test/a11y.spec.tsx` — axe only sees DOM that exists.
- **Interactive component** → a `<Component>A11y.spec.tsx` interaction spec using `test/a11y-utils.ts` (`pressKey` dispatches real `keyCode`s some libraries need; `getTabbables` computes tab order because jsdom has no Tab navigation; `expectSingleTabStop` asserts roving tabindex). Model it on `test/DatepickerA11y.spec.tsx`.
- **Changing `aria-*`/`role`/`alt`/`tabindex` output intentionally** → version-aware dom-compat skip + release-notes "Accessibility changes" entry (procedure in `docs/accessibility.md`, "ARIA is API").

## Pre-finish self-check (run before you call it done)

- [ ] Every interactive element has an accessible name (from `customTranslations.ariaLabels` where user-facing).
- [ ] Everything operable by keyboard alone; composite widgets follow their [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/); roving tabindex where applicable.
- [ ] Dialogs: focus in on open, trapped, Esc closes, focus returns to trigger.
- [ ] Images have `alt`; decorative content is `aria-hidden` (never an unnamed `role="img"`).
- [ ] New message type has a `message-cases.ts` entry and a `live-region-helper.ts` branch.
- [ ] Interactive behavior has/updates a `<Component>A11y.spec.tsx`.
- [ ] No new `eslint-disable jsx-a11y/*` without a `--` justification; no new `knownViolations` entries.
- [ ] Intentional ARIA output changes follow the dom-compat skip + release-notes procedure.
- [ ] `npm run lint:a11y` and `npm run test:a11y` pass.
