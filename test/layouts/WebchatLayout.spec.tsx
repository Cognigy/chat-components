import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Message from "../../src/messages/Message";
import {
	botTextMessage,
	userTextMessage,
	agentTextMessage,
	engagementTextMessage,
	richBotMessage,
	quickRepliesBotMessage,
} from "../fixtures/layout-messages";

describe("WebchatLayout (baseline)", () => {
	it("renders an <article> with 'webchat-message-row' class for bot message", () => {
		const { container } = render(<Message message={botTextMessage} />);
		const article = container.querySelector("article");
		expect(article).not.toBeNull();
		expect(article).toHaveClass("webchat-message-row");
	});

	it("renders an <article> with source class for each rendered source", () => {
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

	it("renders gallery plugin output for a bot gallery message (webchat default)", () => {
		const { container } = render(<Message message={richBotMessage} />);
		const article = container.querySelector("article");
		expect(article).not.toBeNull();
		expect(article).toHaveClass("webchat-message-row");
		expect(article!.textContent).toContain("Item A");
	});

	it("renders quick-replies plugin output for a bot message with quick_replies (webchat default)", () => {
		const { container } = render(<Message message={quickRepliesBotMessage} />);
		const article = container.querySelector("article");
		expect(article).not.toBeNull();
		expect(article!.textContent).toContain("Pick one");
		expect(article!.textContent).toContain("Yes");
		expect(article!.textContent).toContain("No");
	});
});
