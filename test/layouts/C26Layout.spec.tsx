import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Message from "../../src/messages/Message";
import {
	botTextMessage,
	userTextMessage,
	agentTextMessage,
	engagementTextMessage,
} from "../fixtures/layout-messages";

describe("C26Layout — structural", () => {
	it('renders <article> with data-layout="c26" attribute', () => {
		const { container } = render(<Message message={botTextMessage} layout="c26" />);
		const article = container.querySelector("article");
		expect(article).not.toBeNull();
		expect(article).toHaveAttribute("data-layout", "c26");
	});

	it("renders each source type without error", () => {
		// Note: engagement is suppressed by the matcher unless teaserMessage.showInChat
		// is set in config — same as webchat path (see src/matcher.ts).
		for (const msg of [botTextMessage, userTextMessage, agentTextMessage]) {
			const { container, unmount } = render(<Message message={msg} layout="c26" />);
			expect(container.querySelector("article")).toHaveAttribute("data-layout", "c26");
			unmount();
		}

		const { container, unmount } = render(
			<Message message={engagementTextMessage} layout="c26" />,
		);
		expect(container.querySelector("article")).toBeNull();
		unmount();
	});

	it("renders label slot when `label` prop provided", () => {
		render(
			<Message
				message={botTextMessage}
				layout="c26"
				label={{ text: "AI Agent" }}
			/>,
		);
		expect(screen.getByTestId("c26-label")).toBeInTheDocument();
		expect(screen.getByText("AI Agent")).toBeInTheDocument();
	});

	it("renders label icon when `label.icon` provided", () => {
		render(
			<Message
				message={botTextMessage}
				layout="c26"
				label={{ icon: <span data-testid="label-icon">★</span>, text: "AI" }}
			/>,
		);
		expect(screen.getByTestId("label-icon")).toBeInTheDocument();
	});

	it("omits label slot when `label` prop not provided", () => {
		render(<Message message={botTextMessage} layout="c26" />);
		expect(screen.queryByTestId("c26-label")).toBeNull();
	});

	it("renders avatar slot when `avatar` prop provided", () => {
		render(
			<Message
				message={botTextMessage}
				layout="c26"
				avatar={<span data-testid="custom-avatar">A</span>}
			/>,
		);
		expect(screen.getByTestId("c26-avatar")).toBeInTheDocument();
		expect(screen.getByTestId("custom-avatar")).toBeInTheDocument();
	});

	it("omits avatar slot (collapses) when `avatar` prop not provided", () => {
		render(<Message message={botTextMessage} layout="c26" />);
		expect(screen.queryByTestId("c26-avatar")).toBeNull();
	});

	it("renders text content for a bot text message", () => {
		render(<Message message={botTextMessage} layout="c26" />);
		expect(screen.getByText("Hello from bot")).toBeInTheDocument();
	});
});
