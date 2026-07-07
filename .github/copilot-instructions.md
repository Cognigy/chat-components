# Cognigy chat-components - AI Agent Instructions

## Project Overview

**`@cognigy/chat-components`** is a React component library of chat **message renderers** (text, image, video, audio, file, list, gallery, datepicker, text-with-buttons, adaptive cards, xApp, events), published to npm and consumed by **Webchat 3** (exact-pinned dependency), Interaction Panel, Insights, and Live Agent. Built with Vite + TypeScript + CSS modules. Node >= 22.

## Architecture

- **`src/messages/`** — the renderers. `src/matcher.ts` routes an incoming `IMessage` to the right renderer; `src/messages/Message.tsx` is the public `<Message>` component consumers render.
- **`src/common/`** — shared UI (Typography, Buttons, ActionButtons, Avatar, ChatBubble, ChatEvent, MessageHeader, TypingIndicator).
- **`src/messages/live-region-helper.ts`** — computes screen-reader announcement text per message type (Webchat renders the actual live region).
- **`test/demo.tsx`** — demo app (`npm run dev`), deployed to GitHub Pages.
- **Tests**: Vitest + jsdom + React Testing Library. There is **no browser test stack** in this repo (no Cypress — that lives downstream in Webchat).
- **Two DOM contracts**, both driven by the shared corpus `test/fixtures/message-cases.ts`:
    - `test/dom-compat.spec.tsx` — `<Message>` output must be identical to the latest published release (backward compatibility for consumers).
    - `test/a11y.spec.tsx` — every case must be free of WCAG 2.2 A/AA axe violations.

## Build & Test Commands

```bash
npm run dev          # demo app (Vite dev server)
npm run build        # library build to dist/
npm test             # full Vitest run (includes the a11y gate)
npm run test:a11y    # axe gate only (test/a11y.spec.tsx)
npm run lint:a11y    # a11y-only ESLint gate — blocks PRs
npm run lint         # full ESLint (advisory SARIF in CI)
npm run test:dom-compat:install-baseline && npm run build && npm run test:dom-compat
```

## Accessibility (WCAG 2.2 AA) — required for all UI

**All UI code in this repo must meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA.** When writing, modifying, or reviewing any component or markup, apply this and flag violations (full detail: `docs/accessibility.md`):

- **Semantic HTML first**; use ARIA only when native semantics are insufficient, never contradicting the element. For recognizable widgets, implement the keyboard interaction and ARIA roles/states from the matching **[W3C ARIA APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/)**: Dialog (datepicker, lightbox), Grid (calendar), Carousel (gallery), Button, Link, Alert.
- **Accessible name on every interactive element**; user-facing aria strings come from `config.settings.customTranslations.ariaLabels` with a fallback — never hardcode them.
- **Full keyboard operability** — no mouse-only handlers; dialogs move focus in on open, trap it, close on Esc, and restore focus to the trigger (reference implementation: `src/messages/DatePicker/DatePicker.tsx`; focus utilities: `getFocusableElements` in `src/utils.ts`).
- **New message type ⇒ fixture JSON + case entry in `test/fixtures/message-cases.ts`** — one entry feeds BOTH the axe gate and the DOM-compat gate — plus a `getLiveRegionContent` branch in `src/messages/live-region-helper.ts`.
- **Interactive component ⇒ interaction spec** `<Component>A11y.spec.tsx` (keyboard reachability, APG key operation, roving tabindex, focus trap/return). Reference: `test/DatepickerA11y.spec.tsx`; helpers in `test/a11y-utils.ts`.
- **No `eslint-disable jsx-a11y/*` without a `--` justification** naming the real accessible path.
- **Never weaken the known-violation allowlist** in `test/a11y.spec.tsx` — entries need an `AB#` ticket, exist only for pre-existing debt, and are stale-proof (removing the underlying violation is the only exit). Never add one to mask a new regression.
- **ARIA attributes are consumer-facing API**: `aria-*`/`role`/`alt`/`tabindex` in rendered output are part of the DOM-compat contract. Intentional changes require a version-aware skip in `test/dom-compat.spec.tsx` plus an "Accessibility changes" release-notes entry so Webchat re-runs its cypress-axe suite on the version bump.
- **Boundary**: page-level concerns (landmarks, `html lang`, headings, color themes/contrast, target size) are Webchat's responsibility, verified by its real-browser cypress-axe gate. Renderer-internal a11y issues must be fixed **here** and version-bumped — never patched downstream.

**Enforced by** (see `docs/accessibility.md`): static `npm run lint:a11y` and runtime `npm run test:a11y`, both blocking PR checks in `.github/workflows/a11y.yml`, plus a husky pre-commit hook running the a11y lint on staged files.
