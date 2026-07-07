/**
 * Shared accessibility test utilities.
 *
 * Two tool families live here:
 *   1. axe-core wrappers (`runAxe` / `expectNoA11yViolations`) used by the
 *      WCAG 2.2 AA gate in test/a11y.spec.tsx.
 *   2. Keyboard-interaction helpers extracted from test/DatepickerA11y.spec.tsx
 *      so per-component interaction specs (the required pattern for
 *      interactive components — see docs/accessibility.md) don't re-derive
 *      the same jsdom footguns.
 */
import axe from "axe-core";
import type { RunOptions, Result } from "axe-core";

/**
 * WCAG 2.2 Level A + AA axe tags. NOTE: axe-core has no `wcag22a` tag —
 * the 2.2-only additions axe automates are all AA (`wcag22aa`). Keep this
 * list normative-only: no `best-practice`, so the gate blocks exclusively
 * on WCAG conformance.
 */
export const WCAG_22_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Rules axe cannot evaluate meaningfully under jsdom (no layout, paint or
 * scroll metrics). Each entry names its compensating control — these
 * criteria ARE covered, just not here. See docs/accessibility.md
 * ("Division of responsibility").
 */
const JSDOM_DISABLED_RULES: Record<string, string> = {
	// Needs real paint + canvas to sample rendered colors. Covered by
	// Webchat's cypress-axe run (real browser) against the embedded widget.
	"color-contrast": "Webchat E2E (cypress-axe, Chrome + Firefox)",
	// WCAG 2.2 §2.5.8 needs real layout — every rect is 0×0 in jsdom.
	// Covered by Webchat's cypress-axe run.
	"target-size": "Webchat E2E (cypress-axe)",
	// Needs scroll metrics jsdom doesn't compute.
	"scrollable-region-focusable": "Webchat E2E (cypress-axe)",
};

/**
 * Run axe against a rendered container with the gate's WCAG 2.2 AA
 * configuration and return the violations.
 *
 * axe-core cannot run concurrently within one environment ("Axe is already
 * running") — always `await` this helper and never use `test.concurrent`
 * in specs that call it. Don't combine with fake timers (axe times out).
 */
export async function runAxe(container: Element, options: RunOptions = {}): Promise<Result[]> {
	const results = await axe.run(container, {
		runOnly: { type: "tag", values: WCAG_22_AA_TAGS },
		rules: Object.fromEntries(
			Object.keys(JSDOM_DISABLED_RULES).map(rule => [rule, { enabled: false }]),
		),
		resultTypes: ["violations"],
		...options,
	});
	return results.violations;
}

/** Human-readable violation report for assertion failure messages. */
export function formatViolations(violations: Result[]): string {
	return violations
		.map(violation => {
			const nodes = violation.nodes
				.map(
					node =>
						`      ${node.html}\n        → ${node.failureSummary?.replace(/\n/g, "\n        ")}`,
				)
				.join("\n");
			return [
				`  ✗ ${violation.id} (${violation.impact}): ${violation.help}`,
				`    ${violation.helpUrl}`,
				nodes,
			].join("\n");
		})
		.join("\n\n");
}

/**
 * Assert a rendered container has no WCAG 2.2 A/AA axe violations.
 * On failure, prints every violating rule with impact, help URL and the
 * offending HTML.
 */
export async function expectNoA11yViolations(container: Element, options?: RunOptions) {
	const violations = await runAxe(container, options);
	if (violations.length > 0) {
		throw new Error(
			`Expected no WCAG 2.2 A/AA violations, found ${violations.length}:\n\n` +
				`${formatViolations(violations)}\n`,
		);
	}
}

/* ------------------------------------------------------------------ */
/* Keyboard-interaction helpers (extracted from DatepickerA11y.spec.tsx) */
/* ------------------------------------------------------------------ */

/**
 * Dispatch a keydown carrying a real keyCode on the currently-focused
 * element. Some libraries (e.g. flatpickr's native arrow navigation) read
 * `e.keyCode`, and Testing Library's keyDown leaves keyCode at 0 — so
 * interaction specs must dispatch with the numeric code set.
 */
const KEY_CODES: Record<string, number> = {
	Tab: 9,
	Enter: 13,
	Escape: 27,
	Space: 32,
	End: 35,
	Home: 36,
	ArrowLeft: 37,
	ArrowUp: 38,
	ArrowRight: 39,
	ArrowDown: 40,
	PageUp: 33,
	PageDown: 34,
};

export const pressKey = (key: string, shiftKey = false) => {
	const el = document.activeElement as HTMLElement;
	el.dispatchEvent(
		new KeyboardEvent("keydown", {
			key,
			keyCode: KEY_CODES[key],
			shiftKey,
			bubbles: true,
			cancelable: true,
		} as KeyboardEventInit),
	);
};

/**
 * All keyboard-focusable elements under `root`, in DOM order. jsdom does
 * not implement Tab navigation, so tab-order specs assert this computed
 * sequence plus explicit `.focus()` moves instead of dispatching Tab.
 */
export function getTabbables(root: ParentNode): HTMLElement[] {
	const selector = [
		"a[href]",
		"button:not([disabled])",
		"input:not([disabled])",
		"select:not([disabled])",
		"textarea:not([disabled])",
		"audio[controls]",
		"video[controls]",
		"[contenteditable]:not([contenteditable='false'])",
		"[tabindex]",
	].join(",");
	return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
		el => el.tabIndex >= 0 && el.getAttribute("aria-hidden") !== "true",
	);
}

/**
 * Roving-focus invariant: exactly one element matching `selector` under
 * `root` is in the tab sequence (tabindex="0"); all the others are
 * programmatically focusable only (tabindex="-1").
 */
export function expectSingleTabStop(root: ParentNode, selector: string) {
	const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));
	const inTabOrder = elements.filter(el => el.getAttribute("tabindex") === "0");
	if (inTabOrder.length !== 1) {
		throw new Error(
			`Expected exactly one tab stop for "${selector}", found ${inTabOrder.length} ` +
				`of ${elements.length} elements with tabindex="0"`,
		);
	}
}
