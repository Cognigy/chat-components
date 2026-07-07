/**
 * Accessibility gate: every message type this library renders must be free
 * of WCAG 2.2 Level A/AA axe-core violations (see docs/accessibility.md).
 *
 * The sweep iterates the SAME case corpus as the DOM-compatibility gate
 * (test/fixtures/message-cases.ts) — adding a new message type there puts
 * it under both gates automatically. On top of the idle-state sweep,
 * stateful cases scan interaction states (open datepicker dialog, open
 * image lightbox, gallery after slide navigation) where dialog-name and
 * focus-management violations live — axe only sees DOM that exists.
 *
 * Rules that need real layout/paint (color-contrast, target-size,
 * scrollable-region-focusable) are disabled here and covered by Webchat's
 * real-browser cypress-axe gate — see JSDOM_DISABLED_RULES in
 * test/a11y-utils.ts and the "Division of responsibility" section of
 * docs/accessibility.md.
 *
 * KNOWN-VIOLATION ALLOWLIST: pre-existing, ticketed findings can be
 * allowlisted per (case, rule) below. The allowlist is stale-proof in both
 * directions — an unlisted violation fails the gate, AND an allowlisted
 * violation that no longer occurs fails the gate ("stale entry — remove
 * it"), so accessibility debt can only shrink. Every entry needs an AB#
 * ticket.
 *
 * axe-core cannot run concurrently in one environment — tests in this file
 * must stay serial (never `test.concurrent`).
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import Message from "src/messages/Message";
import { coreCases, demoCases, a11yOnlyCases, asBot, type Case } from "./fixtures/message-cases";
import { runAxe, formatViolations } from "./a11y-utils";

import datepickerSingleDate from "./fixtures/datepicker/singleDate.json";
import imageDownloadableFixture from "./fixtures/image-downloadable.json";
import galleryFixture from "./fixtures/gallery.json";

/**
 * Pre-existing, ticketed violations. Keyed by case name; each entry names
 * the axe rule id, the Azure Boards ticket tracking the fix, and why it is
 * temporarily tolerated. Empty is the goal state.
 */
const knownViolations: Record<string, { rule: string; ticket: string; note: string }[]> = {
	// The flatpickr calendar's ARIA grid (reworked in AB#118957) renders
	// role="grid"/"rowgroup" containers whose children are gridcells with
	// no role="row" level in between, and keeps flatpickr's original
	// readonly <input class="flatpickr-input"> without an accessible name.
	// Fixing both means restructuring the calendar DOM (dom-compat skips +
	// screen-reader retest), tracked as a follow-up under AB#144248.
	"stateful: datepicker open dialog": [
		{
			rule: "aria-required-children",
			ticket: "AB#144248",
			note: "flatpickr grid/rowgroup lack role=row children — calendar DOM restructure needed",
		},
		{
			rule: "aria-required-parent",
			ticket: "AB#144248",
			note: "flatpickr day cells (role=gridcell) render outside role=row parents — same restructure",
		},
		{
			rule: "label",
			ticket: "AB#144248",
			note: "flatpickr's original readonly input has no accessible name — needs aria-label via flatpickr config",
		},
	],
};

/**
 * Shared assertion: run axe and apply the allowlist semantics described in
 * the preamble. `caseName` selects the allowlist bucket.
 */
async function expectA11yCompliant(caseName: string, container: Element) {
	const allowed = knownViolations[caseName] ?? [];
	const violations = await runAxe(container);

	const firedRules = new Set(violations.map(violation => violation.id));
	const stale = allowed.filter(entry => !firedRules.has(entry.rule));
	expect(
		stale,
		`Stale allowlist ${stale.map(e => `"${e.rule}" (${e.ticket})`).join(", ")} for ` +
			`"${caseName}" — the violation no longer occurs. Remove the entry (and close the ticket).`,
	).toEqual([]);

	const allowedRules = new Set(allowed.map(entry => entry.rule));
	const tolerated = violations.filter(violation => allowedRules.has(violation.id));
	for (const violation of tolerated) {
		const entry = allowed.find(e => e.rule === violation.id);
		console.warn(
			`[a11y] tolerated known violation in "${caseName}": ${violation.id} — ` +
				`${entry?.ticket}: ${entry?.note}`,
		);
	}

	const unexpected = violations.filter(violation => !allowedRules.has(violation.id));
	if (unexpected.length > 0) {
		throw new Error(
			`WCAG 2.2 A/AA violations in "${caseName}" ` +
				`(${unexpected.length}):\n\n${formatViolations(unexpected)}\n`,
		);
	}
}

const sweepCases: Case[] = [...coreCases, ...demoCases, ...a11yOnlyCases];

describe("Accessibility (WCAG 2.2 AA): message-type sweep", () => {
	it.each(sweepCases)(
		"$name — renders without axe violations",
		async ({ name, message, config, prevMessage }) => {
			const configProp = config as React.ComponentProps<typeof Message>["config"];
			const { container } = render(
				<Message message={message} config={configProp} prevMessage={prevMessage} />,
			);

			// Same guard as dom-compat's assertSameDom: a fixture that fails to
			// match any plugin renders null, and axe on an empty container would
			// pass vacuously without exercising any DOM.
			expect(container.innerHTML).not.toBe("");

			await expectA11yCompliant(name, container);
		},
	);
});

describe("Accessibility (WCAG 2.2 AA): interaction states", () => {
	it("datepicker with open calendar dialog — no axe violations", async () => {
		render(<Message message={asBot(datepickerSingleDate)} />);

		fireEvent.click(screen.getByTestId("button-open"));
		await screen.findByRole("dialog");

		await expectA11yCompliant(
			"stateful: datepicker open dialog",
			screen.getByTestId("datepicker-message"),
		);
	});

	it("image lightbox opened — no axe violations", async () => {
		render(<Message message={asBot(imageDownloadableFixture)} />);

		fireEvent.click(screen.getByRole("button"));
		await screen.findByLabelText("Full-size image viewer");

		// The lightbox may render outside the message container — scan the
		// whole body so portal output is included.
		await expectA11yCompliant("stateful: image lightbox open", document.body);
	});

	it("gallery after navigating to the next slide — no axe violations", async () => {
		const { container } = render(<Message message={asBot(galleryFixture)} />);

		fireEvent.click(screen.getByLabelText("Next slide"));

		await expectA11yCompliant("stateful: gallery after slide navigation", container);
	});
});
