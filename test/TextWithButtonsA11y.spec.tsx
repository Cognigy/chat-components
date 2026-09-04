/**
 * Text-with-buttons / quick replies interaction A11y spec.
 *
 * ActionButtons.spec.tsx covers per-button rendering rules (labels, sr-only
 * text, sanitization); the axe sweep covers static ARIA. This spec locks in
 * the composite behaviors: the button group is named by its message text,
 * every enabled action is a native control in the tab order (in visual
 * order), disabled buttons leave the tab order but stay perceivable, and
 * activation routes correctly (postback action, xApp overlay).
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Message from "src/messages/Message";
import { asBot } from "./fixtures/message-cases";
import { xAppQuickReply } from "./fixtures/messages";
import actionButtonsFixture from "./fixtures/action-buttons.json";
import { getTabbables } from "./a11y-utils";

const renderButtons = (action?: (text?: string, data?: unknown) => void) =>
	render(<Message message={asBot(actionButtonsFixture)} action={action} />);

afterEach(() => {
	vi.restoreAllMocks();
});

describe("TextWithButtons Accessibility", () => {
	it("the button group is a list labelled by the message text", () => {
		renderButtons(vi.fn());

		const group = screen.getByTestId("action-buttons");
		expect(group.tagName).toBe("UL");
		const labelId = group.getAttribute("aria-labelledby");
		expect(labelId).toBeTruthy();
		expect(document.getElementById(labelId as string)).toHaveTextContent("foobar005");

		const items = Array.from(group.querySelectorAll("li"));
		expect(items).toHaveLength(4);
		items.forEach((item, i) => {
			expect(item).toHaveAttribute("aria-posinset", String(i + 1));
			expect(item).toHaveAttribute("aria-setsize", "4");
		});
	});

	it("every action is a native control, in the tab order, in visual order", () => {
		renderButtons(vi.fn());

		const group = screen.getByTestId("action-buttons");
		const tabbables = getTabbables(group);
		expect(tabbables).toHaveLength(4);

		// postback -> <button>, web_url -> <a href>, postback -> <button>,
		// phone_number -> <a href="tel:">: native semantics carry the APG
		// keyboard contract (Enter/Space) without custom key handling.
		expect(tabbables.map(el => el.tagName)).toEqual(["BUTTON", "A", "BUTTON", "A"]);
		expect(tabbables[1]).toHaveAttribute("href");
		expect(tabbables[3]).toHaveAttribute("href", "tel:000111222");
	});

	it("buttons announce their position via visually-hidden text", () => {
		renderButtons(vi.fn());

		const first = getTabbables(screen.getByTestId("action-buttons"))[0];
		expect(first.textContent).toContain("1 of 4: ");
		expect(first.textContent).toContain("foobar005b1");
	});

	it("a web_url button announces that it opens in a new tab", () => {
		renderButtons(vi.fn());

		const link = getTabbables(screen.getByTestId("action-buttons"))[1];
		expect(link.textContent).toContain("Opens in new tab");
	});

	it("activating a postback button sends its payload with the button label", () => {
		const action = vi.fn();
		renderButtons(action);

		fireEvent.click(screen.getByRole("button", { name: /foobar005b1/ }));

		expect(action).toHaveBeenCalledWith("foobar005b1pb", null, { label: "foobar005b1" });
	});

	it("disabled buttons leave the tab order but stay perceivable (aria-disabled)", () => {
		// No `action` prop -> ActionButtons renders every button disabled.
		renderButtons(undefined);

		const group = screen.getByTestId("action-buttons");
		expect(getTabbables(group)).toHaveLength(0);

		const controls = Array.from(group.querySelectorAll("button, a"));
		expect(controls).toHaveLength(4);
		controls.forEach(control => {
			expect(control).toHaveAttribute("aria-disabled", "true");
			expect(control).toHaveAttribute("tabindex", "-1");
		});
	});

	it("an xApp quick reply is a reachable button that opens the xApp overlay", () => {
		const openXAppOverlay = vi.fn();
		const { container } = render(
			<Message message={xAppQuickReply} action={vi.fn()} openXAppOverlay={openXAppOverlay} />,
		);

		const xAppButton = screen.getByRole("button", { name: /Open xApp/ });
		expect(getTabbables(container)).toContain(xAppButton);

		fireEvent.click(xAppButton);
		expect(openXAppOverlay).toHaveBeenCalledWith("https://static.test?testParam=TEST");
	});
});
