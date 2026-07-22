# Cognigy chat-components — project guide for Claude

`@cognigy/chat-components` is a React component library of chat **message renderers** (text, image, video, audio, file, list, gallery, datepicker, text-with-buttons, adaptive cards, xApp, events). It is consumed by **Webchat 3** (exact-pinned), Interaction Panel, Insights, and Live Agent. Build: Vite + TypeScript + CSS modules. Tests: **Vitest + jsdom + React Testing Library** — there is no browser test stack here (no Cypress; Webchat has that downstream). Node >= 22. Demo app: `test/demo.tsx` (`npm run dev`), deployed to GitHub Pages. Tickets are Azure Boards (`AB#…`); PRs are reviewed on GitHub.

## Commands

- `npm run dev` — demo app (Vite dev server).
- `npm run build` — library build to `dist/`.
- `npm test` — full Vitest run (includes the a11y gate; excludes dom-compat).
- `npm run test:a11y` — axe gate only (`test/a11y.spec.tsx`).
- `npm run lint:a11y` — a11y-only ESLint gate (`eslint.a11y.config.js`); what CI blocks on.
- `npm run lint` — full ESLint (a11y rules included; rest is advisory SARIF in CI).
- `npm ci && npm run build && npm run test:dom-compat:install-baseline && npm run test:dom-compat` — DOM-compatibility gate vs. the latest published release. **Order matters** (mirrors `.github/workflows/dom-compat.yml`): build `dist/` against the clean lockfile-pinned tree *before* `install-baseline`, since that step aliases in the published release with `npm install --no-save` and can drift ranged deps in `node_modules`. Building after it produces false diffs (e.g. swiper/radix `aria-controls` mismatches on gallery/audio cases) that never happen on CI.

## Accessibility is non-negotiable

**All UI code in this repo must meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA.** `docs/accessibility.md` is the single source of truth — read it before component work. The hard rules:

- **`npm run lint:a11y` must pass.** The jsx-a11y rules also run in your editor via the main ESLint config; the dedicated config is the blocking CI check and the pre-commit hook.
- **New message type ⇒ fixture JSON + a case entry in `test/fixtures/message-cases.ts`.** That one entry feeds BOTH gates — the axe sweep (`test/a11y.spec.tsx`) and the DOM-compat gate (`test/dom-compat.spec.tsx`). A message type without a corpus entry is uncovered and will be rejected in review.
- **Interactive component ⇒ interaction A11y spec** (`<Component>A11y.spec.tsx`): keyboard reachability, APG key operation, roving-focus single-tab-stop invariants, focus trap/return for dialogs. Reference: `test/DatepickerA11y.spec.tsx`; shared helpers (`pressKey`, `getTabbables`, `expectSingleTabStop`, `runAxe`) in `test/a11y-utils.ts`. axe cannot press keys — the sweep alone is not enough.
- **No `eslint-disable jsx-a11y/*` without a `--` justification** explaining why the rule is a false positive here and where the real accessible path lives (example: the lightbox backdrop in `src/messages/Image/lightbox/Lightbox.tsx` cites the window-level Escape listener and the focusable close button).
- **Never weaken the known-violation allowlist** (`knownViolations` in `test/a11y.spec.tsx`) — entries require an `AB#` ticket, exist only for pre-existing debt, and are stale-proof in both directions (an entry whose violation stopped firing fails the gate). The only way an entry leaves is by removing the underlying violation. Never add one to mask a new regression.
- **ARIA attributes are consumer-facing API.** `aria-*`, `role`, `alt`, `tabindex` in rendered output are part of the DOM contract that dom-compat enforces (its `normalize()` deliberately preserves them, guarded by a test). An intentional change needs: (1) a version-aware skip in `test/dom-compat.spec.tsx` (pattern: `INTENTIONALLY_DIVERGING_PRE_0_77`), and (2) an "Accessibility changes" entry in the release notes so Webchat re-runs its cypress-axe suite on the version bump.
- **Fix renderer-internal a11y issues HERE**, then version-bump — never let a consumer patch around this library's markup. Conversely, page-level concerns (landmarks, `html lang`, headings, color themes/contrast, target size) are Webchat's responsibility, verified by its real-browser cypress-axe gate.

When building UI: semantic HTML first; follow the matching [W3C ARIA APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) for keyboard + ARIA; accessible names from `config.settings.customTranslations.ariaLabels` with a fallback — never hardcode user-facing aria text. The `wcag-component` skill (`.claude/skills/wcag-component/`) has this repo's copy-paste recipes and reference implementations.

## Reuse these — don't reinvent

- **Focus discovery / trap:** `getFocusableElements(element)` — `src/utils.ts` (used by the DatePicker dialog trap).
- **Dialog reference implementation:** `src/messages/DatePicker/DatePicker.tsx` — trigger with `aria-expanded`/`aria-controls`/`aria-haspopup="dialog"`; `role="dialog"` + `aria-modal` + `aria-labelledby`; focus-to-heading on open; Esc closes; focus returns to trigger.
- **Screen-reader announcement text:** `getLiveRegionContent` — `src/messages/live-region-helper.ts`. A new message type needs a branch there so Webchat's live region can announce it.
- **Lightweight dialog + Esc:** `src/messages/Image/lightbox/Lightbox.tsx`.

## DOM compatibility

`<Message>` output is a backward-compatibility contract: `test/dom-compat.spec.tsx` renders the shared corpus through this branch and the latest published npm release and requires identical DOM (ids/CSS-module hashes normalized; semantic attributes preserved). Any structural change to rendered output is a breaking change for consumers unless it goes through the version-aware skip + release-notes procedure above.
