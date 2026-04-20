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

describe("C26Layout — structural", () => {
	it('renders <article> with data-layout="c26" attribute', () => {
		const { container } = render(<Message message={botTextMessage} layout="c26" />);
		const article = container.querySelector("article");
		expect(article).not.toBeNull();
		expect(article).toHaveAttribute("data-layout", "c26");
	});

	it("renders each source type without error", () => {
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
		render(<Message message={botTextMessage} layout="c26" label={{ text: "AI Agent" }} />);
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

	it("renders gallery plugin output when layout=c26", () => {
		const { container } = render(<Message message={richBotMessage} layout="c26" />);
		const article = container.querySelector("article");
		expect(article).toHaveAttribute("data-layout", "c26");
		expect(article!.textContent).toContain("Item A");
	});

	it("renders quick-replies plugin output when layout=c26", () => {
		const { container } = render(<Message message={quickRepliesBotMessage} layout="c26" />);
		const article = container.querySelector("article");
		expect(article).toHaveAttribute("data-layout", "c26");
		expect(article!.textContent).toContain("Pick one");
		expect(article!.textContent).toContain("Yes");
		expect(article!.textContent).toContain("No");
	});

	it("fullscreen escape hatch bypasses c26 layout (no article rendered)", () => {
		// Context-free plugin so the fullscreen path renders without MessageProvider.
		const fullscreenPlugin = {
			match: () => true,
			component: () => <div data-testid="fullscreen-plugin">Fullscreen content</div>,
		};
		const { container } = render(
			<Message
				message={botTextMessage}
				layout="c26"
				isFullscreen={true}
				plugins={[fullscreenPlugin]}
			/>,
		);
		const article = container.querySelector("article");
		expect(article).toBeNull();
		expect(screen.getByTestId("fullscreen-plugin")).toBeInTheDocument();
	});
});
