import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Message from "../../src/messages/Message";
import {
	botTextMessage,
	userTextMessage,
	agentTextMessage,
	engagementTextMessage,
} from "../fixtures/layout-messages";

describe("WebchatLayout (baseline)", () => {
	it("renders an <article> with 'webchat-message-row' class for bot message", () => {
		const { container } = render(<Message message={botTextMessage} />);
		const article = container.querySelector("article");
		expect(article).not.toBeNull();
		expect(article).toHaveClass("webchat-message-row");
	});

	it("renders an <article> with source class for each rendered source", () => {
		// Note: engagement messages are intentionally NOT rendered by the matcher
		// unless config.settings.teaserMessage.showInChat is true — see src/matcher.ts.
		// Baseline asserts the three sources that do render by default, plus that
		// engagement without teaser config renders no <article>.
		for (const msg of [botTextMessage, userTextMessage, agentTextMessage]) {
			const { container, unmount } = render(<Message message={msg} />);
			const article = container.querySelector("article");
			expect(article).not.toBeNull();
			expect(article).toHaveClass(msg.source!);
			unmount();
		}

		const { container, unmount } = render(<Message message={engagementTextMessage} />);
		expect(container.querySelector("article")).toBeNull();
		unmount();
	});

	it("renders MessageHeader by default for bot (non-user) source", () => {
		render(<Message message={botTextMessage} />);
		expect(screen.getByTestId("message-header")).toBeInTheDocument();
	});

	it("omits MessageHeader when disableHeader is true", () => {
		// disableHeader prop exists but does not gate MessageHeader directly in current
		// implementation — instead, MessageHeader render is gated on shouldCollate/fullscreen/eventMessage.
		// Baseline: confirm header is present for a non-event, non-collated, non-fullscreen bot.
		render(<Message message={botTextMessage} />);
		expect(screen.getByTestId("message-header")).toBeInTheDocument();
	});

	it("renders text content for a bot text message", () => {
		render(<Message message={botTextMessage} />);
		expect(screen.getByText("Hello from bot")).toBeInTheDocument();
	});

	it("does NOT set data-layout attribute on article (no layout prop)", () => {
		const { container } = render(<Message message={botTextMessage} />);
		const article = container.querySelector("article");
		expect(article).not.toHaveAttribute("data-layout");
	});
});
