# Accessibility (WCAG 2.2 AA)

`@cognigy/chat-components` targets **[WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA**. Accessibility is part of the Definition of Done for every component change, and it is enforced by tooling, not left to memory. This page is the single source of truth for how accessibility is built, tested, and reviewed here.

WCAG defines _what_ must be true; for _how_ each widget should behave (keyboard interaction and ARIA roles/states), follow the **[W3C ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/patterns/)**. The `wcag-component` skill and the `a11y-reviewer` agent link the patterns relevant to this library (dialog, carousel, grid, button, link, alert).

## Scope

This library renders the message DOM consumed by **Webchat 3** (exact-pinned dependency), Interaction Panel, Insights, and Live Agent. Everything _inside_ a rendered message — roles, accessible names, keyboard operability, focus management, live-region text — is this repo's responsibility. Page-level concerns (landmarks, `html lang`, heading hierarchy, color themes/contrast, target size) belong to the consumer; see [Division of responsibility](#division-of-responsibility-this-library-vs-webchat).

Renderer-internal accessibility issues must be fixed **here** and shipped with a version bump — never patched around downstream. Webchat's own `docs/accessibility.md` states the same boundary from the other side.

## Definition of Done for component work

1. **Static lint passes** — `npm run lint:a11y` reports no errors.
2. **The runtime axe gate covers the change** — `npm run test:a11y` passes, and:
    - **New message type** → add its fixture JSON and one case entry to `test/fixtures/message-cases.ts`. That single entry puts it under both the accessibility gate and the DOM-compat gate automatically (see [The shared corpus rule](#the-shared-corpus-rule)).
    - **New interaction state** (a dialog opens, a slide changes, …) → add a stateful scan to `test/a11y.spec.tsx` — axe only sees DOM that exists.
3. **Interactive component ⇒ interaction spec** — components with keyboard behavior need a `<Component>A11y.spec.tsx` (see [Keyboard & interaction specs](#keyboard--interaction-specs)).
4. **Intentional ARIA changes follow the ["ARIA is API"](#aria-is-api) procedure** — version-aware dom-compat skip + release-notes entry.

## The gates

### 1. Static: ESLint `jsx-a11y` — `npm run lint:a11y`

- Dedicated flat config [`eslint.a11y.config.js`](../eslint.a11y.config.js) runs **only** the `eslint-plugin-jsx-a11y` recommended rules, as shipped (errors) — so the gate is independent of unrelated lint debt.
- `settings["jsx-a11y"].components` maps `Button`/`PrimaryButton`/`SecondaryButton` → `button`, so the rules see through the library's own wrappers (an icon-only `<PrimaryButton>` without an accessible name is flagged like a native `<button>`). Only wrappers that statically render one element **and** forward their props belong in that map — see the comment in the config for why polymorphic wrappers don't.
- Ignores: `dist`, `dist-demo`, `node_modules`, `test/__mocks__` (test-only mocks never ship; their DOM is exercised by the runtime gate instead).
- The same rules are also spread into the main [`eslint.config.js`](../eslint.config.js), so editors surface violations during normal work. The full `npm run lint` / SARIF flow in `lint.yml` stays advisory.
- Every `eslint-disable jsx-a11y/*` requires a justification — see [the format below](#eslint-disable-jsx-a11y-requires-a-justification).

### 2. Runtime: axe-core over the message corpus — `npm run test:a11y`

- [`test/a11y.spec.tsx`](../test/a11y.spec.tsx) renders **every** case from the shared corpus `test/fixtures/message-cases.ts` (`coreCases` + `demoCases` + `a11yOnlyCases`) through `<Message>` and runs axe-core against the result.
- Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` — strictly normative, no `best-practice`. Note: axe-core has **no `wcag22a` tag**; the 2.2-only additions axe automates are all AA.
- On top of the idle-state sweep, **interaction-state scans** cover DOM that only exists after user action: the open datepicker dialog, the open image lightbox, and the gallery after slide navigation.
- Helpers live in [`test/a11y-utils.ts`](../test/a11y-utils.ts): `runAxe`, `expectNoA11yViolations`, `formatViolations`.
- The spec is part of plain `npm test` too, so it cannot be forgotten locally.
- axe-core cannot run concurrently in one environment — specs that call it must stay serial (never `test.concurrent`) and must not use fake timers.

### CI: `.github/workflows/a11y.yml` ("Accessibility")

Two **blocking** PR checks, one job per gate so each shows as its own check:

- **Accessibility lint (jsx-a11y)** — `npm run lint:a11y`
- **Accessibility axe (WCAG 2.2 AA)** — `npm run test:a11y`

The full-ESLint SARIF upload in `lint.yml` is unchanged — it is advisory code scanning; these jobs are the enforcement.

> Post-merge follow-up: a repository admin must mark both checks **required** in `main` branch protection so the gates fully block merges.

### Pre-commit

husky + lint-staged run the a11y-only ESLint on staged `*.{ts,tsx}` files (see `lint-staged` in `package.json`), so static violations fail before they ever reach CI.

## The shared corpus rule

[`test/fixtures/message-cases.ts`](../test/fixtures/message-cases.ts) is the single source of truth for "every message type this library renders". Two gates iterate the same tables:

- [`test/dom-compat.spec.tsx`](../test/dom-compat.spec.tsx) renders each case through this branch **and** the latest published release and compares the DOM — the backward-compatibility contract for Webchat 3 and the other consumers.
- [`test/a11y.spec.tsx`](../test/a11y.spec.tsx) renders each case and runs axe — the WCAG 2.2 AA contract.

**When you add a message type to the library, add its fixture JSON and a case entry there.** Both gates then cover it automatically, with no further wiring — the two contracts can never drift apart. (`a11yOnlyCases` exists for cases dom-compat must temporarily exclude for baseline-version reasons; the a11y sweep always takes the superset.)

Both gates guard against vacuous passes: a fixture that fails to match any plugin renders null, and an empty container would pass axe (or `empty === empty` in dom-compat) without exercising any DOM — so both assert the rendered HTML is non-empty.

## Division of responsibility: this library vs. Webchat

| Concern                                                           | Owner           | Enforced by                                             |
| ----------------------------------------------------------------- | --------------- | ------------------------------------------------------- |
| Roles, accessible names, `alt` text inside messages               | chat-components | `npm run test:a11y` (axe) + `npm run lint:a11y`         |
| Keyboard operability & focus management inside components         | chat-components | Interaction specs (`<Component>A11y.spec.tsx`)          |
| Live-region announcement text per message type                    | chat-components | `src/messages/live-region-helper.ts` (+ its unit specs) |
| Page landmarks, `html lang`, heading hierarchy                    | Webchat         | Webchat's cypress-axe gate                              |
| Color themes / contrast                                           | Webchat         | Webchat's cypress-axe gate (real browser)               |
| Target size (WCAG 2.2 SC 2.5.8)                                   | Webchat         | Webchat's cypress-axe gate                              |
| Chat-log live-region wiring, focus orchestration between messages | Webchat         | Webchat's cypress-axe gate + E2E                        |

Webchat's gate is documented in its own `docs/accessibility.md` (introduced in Webchat PR #286): a real-browser cypress-axe scan of the embedded widget — which includes every component this library renders. That downstream scan is the compensating control for everything jsdom cannot evaluate (next section).

## jsdom caveats (and what compensates for each)

Vitest runs under jsdom — no layout, paint, or scroll metrics. The axe gate disables the rules that need them (`JSDOM_DISABLED_RULES` in [`test/a11y-utils.ts`](../test/a11y-utils.ts)); every disabled rule and shim has a named compensating control:

| Caveat                                                                                                                        | Where                                                    | Compensating control                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `color-contrast` rule disabled — needs real paint to sample rendered colors                                                   | `test/a11y-utils.ts`                                     | Webchat's cypress-axe run (Chrome + Firefox) against the embedded widget                 |
| `target-size` rule disabled (WCAG 2.2 SC 2.5.8) — every rect is 0×0 in jsdom                                                  | `test/a11y-utils.ts`                                     | Webchat's cypress-axe run                                                                |
| `scrollable-region-focusable` rule disabled — jsdom computes no scroll metrics                                                | `test/a11y-utils.ts`                                     | Webchat's cypress-axe run                                                                |
| jsdom lacks `innerText`; adaptivecards sets all TextRun/label/action text via `innerText`, so accessible names resolved empty | shim in `test/setup.js` maps `innerText` → `textContent` | Real browsers implement `innerText` natively — the shim makes jsdom match browser output |
| `react-player` is mocked (`test/__mocks__/react-player.tsx`) — audio/video specs exercise the mock's DOM, not the real player | `test/__mocks__/`                                        | Real player DOM covered by Webchat's cypress-axe E2E and manual demo checks              |

## Known-violation allowlist (stale-proof)

Pre-existing, ticketed violations can be tolerated per **(case, rule)** in `knownViolations` in [`test/a11y.spec.tsx`](../test/a11y.spec.tsx):

```ts
const knownViolations: Record<string, { rule: string; ticket: string; note: string }[]> = {
	"stateful: datepicker open dialog": [
		{
			rule: "aria-required-children",
			ticket: "AB#144248",
			note: "flatpickr grid/rowgroup lack role=row children — calendar DOM restructure needed",
		},
	],
};
```

The semantics are **stale-proof in both directions**, so accessibility debt can only shrink:

- A violation **not** on the list fails the gate.
- An allowlisted violation that **stops firing also fails** the gate ("stale entry — remove it") — entries cannot silently outlive their bug. Remove the entry and close the ticket.
- Every entry needs an Azure Boards ticket (`AB#…`). Empty is the goal state.
- Adding an entry to mask a **new** regression is never acceptable — the allowlist exists only for pre-existing debt discovered when a gate tightened.

Current entries: three for `"stateful: datepicker open dialog"` (flatpickr calendar internals: `aria-required-children`, `aria-required-parent`, `label`), all tracked under **AB#144248**.

## `eslint-disable jsx-a11y/*` requires a justification

Suppressing an a11y rule is allowed only for genuine false positives, and the directive must carry a `--` justification explaining **why the rule doesn't apply here** and, where relevant, **where the real accessible path lives**. Real example from this branch, [`src/messages/Image/lightbox/Lightbox.tsx`](../src/messages/Image/lightbox/Lightbox.tsx):

```tsx
{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-to-close
    backdrop is a pointer convenience; the keyboard path exists: the window-level
    Escape listener above closes the dialog and LightboxHeader renders a focusable
    close button. */}
<div className={classes.content} onClick={handleOnClickBackdrop}>
```

Six disables exist today, all justified false-positive/intentional patterns: render-prop anchors (`src/common/ActionButtons/ActionButton.tsx`, `src/messages/Text/Text.tsx` markdown link override), hidden download anchors (`src/messages/Audio/Controls.tsx`, `src/messages/Video/Video.tsx`), the dialog keydown handler (`src/messages/DatePicker/DatePicker.tsx`), and the lightbox backdrop/image click (`src/messages/Image/lightbox/Lightbox.tsx`). A disable without a justification is a review blocker; so is one whose justification amounts to "didn't want to fix it".

## ARIA is API

Assistive-technology behavior in every consumer depends on this library's rendered `aria-*`, `role`, `alt`, and `tabindex` attributes — they are part of the public DOM contract, exactly like class hooks:

- dom-compat's `normalize()` **deliberately preserves** `aria-*`/`role`/`alt`/`tabindex`; only generated id _values_ inside them are masked. A guard test ("normalize preserves the accessibility contract") makes it impossible to weaken this silently.
- **Intentional ARIA change procedure:**
    1. Add the affected case names to a **version-aware skip** in `test/dom-compat.spec.tsx` — see `INTENTIONALLY_DIVERGING_PRE_0_80`: the skip only applies while the installed baseline is older than the release that ships the change, so the cases re-enable themselves once that version is on npm `latest`. Include a TODO to delete the block.
    2. Add an **"Accessibility changes"** entry to the GitHub release notes of the version that ships it, so Webchat re-runs its cypress-axe suite (and screen-reader spot checks) when it bumps the pinned dependency.
- Example: a single-button `ActionButtons` container with an associated text/title renders `role="group"` since 0.80.0 so its `aria-labelledby` is exposed reliably, and a container whose message has no text carries no `aria-labelledby` at all (CGY-3281); the affected cases are skipped against baselines < 0.80.0.

## Keyboard & interaction specs

axe audits static ARIA; it cannot press keys. Interactive components therefore need a dedicated **`<Component>A11y.spec.tsx`** interaction spec covering:

- **Keyboard reachability** — every control reachable, in a sensible order (`getTabbables`).
- **APG key operation** — arrows/Home/End/PageUp/PageDown/Enter/Esc behave per the matching [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/).
- **Roving focus** — composite widgets keep exactly one tab stop (`expectSingleTabStop`).
- **Focus trap & return** — dialogs: focus moves in on open, is trapped (Tab and Shift+Tab), Esc closes, focus returns to the trigger.

Reference implementation: [`test/DatepickerA11y.spec.tsx`](../test/DatepickerA11y.spec.tsx) (the APG grid pattern for the flatpickr calendar). Shared helpers in [`test/a11y-utils.ts`](../test/a11y-utils.ts) so specs don't re-derive jsdom footguns:

| Helper                                | Use                                                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pressKey(key, shiftKey?)`            | Dispatch a keydown with a **real `keyCode`** on `document.activeElement` — some libraries (flatpickr) read `e.keyCode`, which Testing Library leaves at 0 |
| `getTabbables(root)`                  | The computed tab sequence — jsdom does not implement Tab navigation, so specs assert this order plus explicit `.focus()` moves                            |
| `expectSingleTabStop(root, selector)` | The roving-tabindex invariant: exactly one `tabindex="0"`, the rest `-1`                                                                                  |
| `runAxe` / `expectNoA11yViolations`   | axe scan of a specific interaction state                                                                                                                  |

Backlog candidates without a spec yet: Gallery/swiper, Lightbox, Audio controls, AdaptiveCards actions.

## Running everything locally

```bash
npm run lint:a11y	# static gate — jsx-a11y rules only, errors
npm run test:a11y	# runtime gate — axe over the message corpus + interaction states
npm test		# full Vitest run (includes a11y.spec.tsx; dom-compat is excluded)

# DOM-compat gate (aria attributes are part of this contract):
npm run test:dom-compat:install-baseline	# installs the latest published release as baseline
npm run build
npm run test:dom-compat

npm run dev		# demo app — manual keyboard / screen-reader / contrast checks
```

The pre-commit hook (husky + lint-staged) runs the a11y lint on staged files automatically.

## Working with AI assistants on accessibility

This repo ships AI-assistant configuration so AI-assisted work stays accessible by default:

- **[`CLAUDE.md`](../CLAUDE.md)** — auto-loaded baseline rules (Claude Code).
- **`.claude/skills/wcag-component/`** — per-component-type recipes with this repo's reference implementations (loaded on demand).
- **`.claude/agents/a11y-reviewer.md`** + **`/a11y-review`** command — an accessibility-focused reviewer you can run on a diff.
- **[`.github/copilot-instructions.md`](../.github/copilot-instructions.md)** — repository custom instructions; includes an Accessibility section so GitHub Copilot's suggestions and PR review follow the same rules.

## Manual checks

Automated gates catch a lot but not everything. Before merging non-trivial component changes, open the demo (`npm run dev`):

- Tab through the change with the keyboard only — every control reachable and operable, focus always visible.
- Test with a screen reader (NVDA/VoiceOver) for names, roles, and announcements.
- Run the free **axe DevTools** browser extension on the demo page — a real browser catches contrast and target-size findings jsdom can't.
- Check zoom to 200% and `prefers-reduced-motion`.

## Follow-ups / backlog

- **AB#144248 — flatpickr calendar DOM restructure**: give the calendar grid proper `role="row"` structure and an accessible name for flatpickr's original readonly input. Removes all three allowlist entries (which will then fail as stale — by design).
- **Interaction A11y specs** for Gallery/swiper, Lightbox, Audio controls, and AdaptiveCards actions (pattern: `test/DatepickerA11y.spec.tsx`).
- **Branch protection** (repo admin): mark **Accessibility lint (jsx-a11y)** and **Accessibility axe (WCAG 2.2 AA)** as required checks on `main`.
- **Webchat-side verification**: Webchat's `cy.checkA11yCompliance()` tag list should include `wcag22aa` and drop `wcag22a` — that tag does not exist in axe-core, so it currently adds nothing. Verify and fix in the Webchat repo.
