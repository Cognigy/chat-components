/**
 * Adaptive Cards interaction A11y spec.
 *
 * The axe sweep only sees the collapsed card — an expanded Action.ShowCard
 * (with its labelled inputs) exists only after activation, and axe cannot
 * press buttons. This spec covers the interactive contract of the rendered
 * card: actions are native named controls in the tab order, Action.ShowCard
 * reveals labelled inputs, Action.Submit routes through the message
 * `action`, and Action.OpenUrl opens its sanitized URL in a new tab with
 * noopener (dangerous URLs are neutralized, matching List/Gallery). The axe
 * scan of the expanded ShowCard state lives in the gate (test/a11y.spec.tsx).
 *
 * NOTE: adaptivecards sets text via `element.innerText`, which jsdom maps
 * onto textContent through the shim in test/setup.js — accessible names
 * asserted here depend on it.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Message from "src/messages/Message";
import type { IWebchatConfig } from "src/messages/types";
import { asBot } from "./fixtures/message-cases";
import adaptiveCardsFixture from "./fixtures/adaptiveCards.json";
import { getTabbables } from "./a11y-utils";

// Fixture [0]: card with an Action.ShowCard ("Set visit date" -> date +
// comment inputs + Submit "OK") and an Action.OpenUrl ("Learn more").
const showCardMessage = () => asBot((adaptiveCardsFixture as unknown as object[])[0]);

// Same card with the Action.OpenUrl URL swapped for a dangerous scheme.
const dangerousOpenUrlMessage = () => {
	const raw = JSON.parse(JSON.stringify((adaptiveCardsFixture as unknown as object[])[0]));
	raw.data._cognigy._webchat.adaptiveCard.actions[1].url = "javascript:alert(1)";
	return asBot(raw);
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Adaptive Cards Accessibility (actions)", () => {
	it("card actions render as native named controls in the tab order", () => {
		const { container } = render(<Message message={showCardMessage()} action={vi.fn()} />);

		const showCard = screen.getByRole("button", { name: "Set visit date" });
		// adaptivecards exposes Action.OpenUrl with role="link" — it navigates.
		const openUrl = screen.getByRole("link", { name: "Learn more" });
		const tabbables = getTabbables(container);
		expect(tabbables).toContain(showCard);
		expect(tabbables).toContain(openUrl);
	});

	it("headings inside the card carry an aria-level", () => {
		const { container } = render(<Message message={showCardMessage()} action={vi.fn()} />);

		const headings = Array.from(container.querySelectorAll("[role='heading']"));
		expect(headings.length).toBeGreaterThan(0);
		headings.forEach(heading => expect(heading).toHaveAttribute("aria-level"));
	});

	it("Action.ShowCard reveals labelled inputs in the tab order", async () => {
		// The axe scan of this expanded state lives in the gate:
		// test/a11y.spec.tsx, "stateful: adaptive card expanded ShowCard".
		const { container } = render(<Message message={showCardMessage()} action={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "Set visit date" }));

		// The inner card's inputs must expose their labels as accessible names.
		const dateInput = await screen.findByLabelText(/Planned visit time/);
		expect(getTabbables(container)).toContain(dateInput);
		expect(screen.getByLabelText(/Optional/)).toBeInTheDocument();
	});

	it("Action.Submit inside the expanded card routes through the message action", async () => {
		const action = vi.fn();
		render(<Message message={showCardMessage()} action={action} />);

		fireEvent.click(screen.getByRole("button", { name: "Set visit date" }));
		fireEvent.click(await screen.findByRole("button", { name: "OK" }));

		await waitFor(() => expect(action).toHaveBeenCalled());
	});

	it("Action.OpenUrl is exposed as a link and opens its URL in a new tab with noopener", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		render(<Message message={showCardMessage()} action={vi.fn()} />);

		fireEvent.click(screen.getByRole("link", { name: "Learn more" }));

		expect(openSpy).toHaveBeenCalledWith(
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			"_blank",
			"noopener",
		);
	});

	it("Action.OpenUrl with a dangerous URL does not navigate", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		render(<Message message={dangerousOpenUrlMessage()} action={vi.fn()} />);

		fireEvent.click(screen.getByRole("link", { name: "Learn more" }));

		expect(openSpy).not.toHaveBeenCalled();
	});

	it("Action.OpenUrl passes the raw URL through when sanitization is disabled (opt-out)", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		render(
			<Message
				message={dangerousOpenUrlMessage()}
				action={vi.fn()}
				config={
					{
						settings: { layout: { disableUrlButtonSanitization: true } },
					} as IWebchatConfig
				}
			/>,
		);

		fireEvent.click(screen.getByRole("link", { name: "Learn more" }));

		// The opt-out passes the raw URL to window.open, which the browser
		// blocks for javascript: — matching the ActionButtons opt-out contract.
		expect(openSpy).toHaveBeenCalledWith("javascript:alert(1)", "_blank", "noopener");
	});

	it("actions do nothing when the conversation has ended", async () => {
		const action = vi.fn();
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		render(<Message message={showCardMessage()} action={action} isConversationEnded />);

		fireEvent.click(screen.getByRole("link", { name: "Learn more" }));
		expect(openSpy).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Set visit date" }));
		fireEvent.click(await screen.findByRole("button", { name: "OK" }));
		expect(action).not.toHaveBeenCalled();
	});
});
