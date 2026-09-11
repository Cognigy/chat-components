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
import datepickerWeekNumbers from "./fixtures/datepicker/weekNumbers.json";
import imageDownloadableFixture from "./fixtures/image-downloadable.json";
import imageDownloadableNoAltFixture from "./fixtures/image-downloadable-no-alt.json";
import galleryFixture from "./fixtures/gallery.json";
import audioFixture from "./fixtures/audio.json";
import adaptiveCardsFixture from "./fixtures/adaptiveCards.json";

/**
 * Pre-existing, ticketed violations. Keyed by case name; each entry names
 * the axe rule id, the CSS selectors of the ONLY nodes the rule may fire on
 * (a node outside that list is a new regression and fails the gate), the
 * Azure Boards ticket tracking the fix, and why it is tolerated. Empty is
 * the goal state.
 */
type KnownViolation = { rule: string; nodes: string[]; ticket: string; note: string };

// The flatpickr calendar's day cells must stay flat DOM children of
// `.dayContainer` (flatpickr's arrow navigation and range hover index them
// by position), so the role="row" level is provided by hidden row elements
// that claim their cells via aria-owns (CGY-30560). Browsers give aria-owns
// precedence over DOM parentage, so the accessibility tree is
// grid > rowgroup > row > gridcell — but axe's aria-required-children check
// does not model that precedence: getOwnedRoles (axe-core) walks from the
// grid/rowgroup through the presentation-role wrappers and still counts the
// gridcells (and, with week numbers, the aria-owned rowheaders) as their DOM
// ancestors' own children. This documents that tooling limitation, not
// markup debt; the only way it leaves is an axe-core fix (or a flatpickr DOM
// that can hold real rows).
const AXE_ARIA_OWNS_LIMITATION = {
	rule: "aria-required-children",
	ticket: "AB#144248",
	note: "axe ignores aria-owns precedence: cells owned by the hidden role=row elements are still counted under their DOM ancestors (grid / rowgroup)",
};

const knownViolations: Record<string, KnownViolation[]> = {
	"stateful: datepicker open dialog": [
		{
			...AXE_ARIA_OWNS_LIMITATION,
			nodes: ['.flatpickr-rContainer[role="grid"]', '.flatpickr-days[role="rowgroup"]'],
		},
	],
	// With week numbers the grid moves up to `.flatpickr-innerContainer` (it
	// owns the week column); the same double count applies there.
	"stateful: datepicker week numbers open dialog": [
		{
			...AXE_ARIA_OWNS_LIMITATION,
			nodes: ['.flatpickr-innerContainer[role="grid"]', '.flatpickr-days[role="rowgroup"]'],
		},
	],
};

/**
 * Shared assertion: run axe and apply the allowlist semantics described in
 * the preamble. `caseName` selects the allowlist bucket.
 */
async function expectA11yCompliant(caseName: string, container: Element) {
	const allowed = knownViolations[caseName] ?? [];
	// elementRef: the allowlist is node-granular, so each violating node is
	// matched against the entry's selectors.
	const violations = await runAxe(container, { elementRef: true });

	const firedRules = new Set(violations.map(violation => violation.id));
	const stale = allowed.filter(entry => !firedRules.has(entry.rule));
	expect(
		stale,
		`Stale allowlist ${stale.map(e => `"${e.rule}" (${e.ticket})`).join(", ")} for ` +
			`"${caseName}" — the violation no longer occurs. Remove the entry (and close the ticket).`,
	).toEqual([]);

	const allowedRules = new Set(allowed.map(entry => entry.rule));
	const unexpected = violations.filter(violation => !allowedRules.has(violation.id));
	for (const violation of violations.filter(violation => allowedRules.has(violation.id))) {
		const entry = allowed.find(e => e.rule === violation.id)!;
		// Only the listed nodes are tolerated; the same rule firing anywhere
		// else in the scanned state is a new regression.
		const strayNodes = violation.nodes.filter(
			node => !entry.nodes.some(selector => node.element?.matches(selector)),
		);
		if (strayNodes.length > 0) {
			unexpected.push({ ...violation, nodes: strayNodes });
			continue;
		}
		console.warn(
			`[a11y] tolerated known violation in "${caseName}": ${violation.id} on ` +
				`${violation.nodes.map(node => node.target.join(" ")).join(", ")} — ` +
				`${entry.ticket}: ${entry.note}`,
		);
	}

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

	it("datepicker (week numbers) with open calendar dialog — no axe violations", async () => {
		// The week column exists only in this configuration: the grid moves up
		// to `.flatpickr-innerContainer` (aria-colcount 8), the header row gets
		// the "Week" columnheader and every week number is an aria-owned
		// rowheader — none of which the single-date dialog scan above sees.
		render(<Message message={asBot(datepickerWeekNumbers)} />);

		fireEvent.click(screen.getByTestId("button-open"));
		await screen.findByRole("dialog");

		await expectA11yCompliant(
			"stateful: datepicker week numbers open dialog",
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

	it("image lightbox opened for a message with no alt text — no axe violations", async () => {
		// Regression for CGY-37634: with `altText` undefined the full-size <img>
		// rendered no alt attribute at all (axe image-alt, critical). The
		// `image-downloadable` fixture's altText: "" never exercised this path.
		render(<Message message={asBot(imageDownloadableNoAltFixture)} />);

		fireEvent.click(screen.getByRole("button"));
		await screen.findByLabelText("Full-size image viewer");

		await expectA11yCompliant("stateful: image lightbox open (no alt text)", document.body);
	});

	it("gallery after navigating to the next slide — no axe violations", async () => {
		const { container } = render(<Message message={asBot(galleryFixture)} />);

		fireEvent.click(screen.getByLabelText("Next slide"));

		await expectA11yCompliant("stateful: gallery after slide navigation", container);
	});

	it("adaptive card with expanded ShowCard — no axe violations", async () => {
		// Fixture [0]'s Action.ShowCard reveals labelled inputs + a Submit
		// action that exist only after activation — the collapsed-card sweep
		// case never sees them.
		const { container } = render(
			<Message message={asBot((adaptiveCardsFixture as unknown as object[])[0])} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "Set visit date" }));
		await screen.findByLabelText(/Planned visit time/);

		await expectA11yCompliant("stateful: adaptive card expanded ShowCard", container);
	});

	it("audio player with open More-options menu — no axe violations", async () => {
		render(<Message message={asBot(audioFixture)} />);

		fireEvent.click(await screen.findByRole("button", { name: "More options" }));
		await screen.findByRole("menu");

		// The Radix popover renders into a portal — scan the whole body.
		await expectA11yCompliant("stateful: audio options menu open", document.body);
	});
});
