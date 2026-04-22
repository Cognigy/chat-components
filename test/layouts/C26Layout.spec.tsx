import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

	it("C26Layout .bubble has box-shadow applied via --cc-bubble-box-shadow", () => {
		const css = readFileSync(
			resolve(__dirname, "../../src/layouts/C26Layout.module.css"),
			"utf8",
		);
		expect(css).toMatch(/\.bubble\s*\{[^}]*?box-shadow:\s*var\(--cc-bubble-box-shadow\)/);
	});

	it("C26Layout .bubble has role-differentiated max-width selectors", () => {
		const css = readFileSync(
			resolve(__dirname, "../../src/layouts/C26Layout.module.css"),
			"utf8",
		);
		expect(css).toMatch(/\.article:not\(\[data-source="user"\]\)\s+\.bubble\s*\{[^}]*?max-width:\s*var\(--cc-bubble-max-width-bot\)/);
		expect(css).toMatch(/\.article\[data-source="user"\]\s+\.bubble\s*\{[^}]*?max-width:\s*var\(--cc-bubble-max-width-user\)/);
	});

	it("has align-self: end on .avatar in the CSS module (bottom-anchored)", () => {
		const css = readFileSync(
			resolve(__dirname, "../../src/layouts/C26Layout.module.css"),
			"utf8",
		);
		expect(css).toMatch(/\.avatar\s*\{[^}]*?align-self:\s*end/);
	});

	it("C26Layout .bubble has asymmetric-corner tail (bot: bottom-left, user: bottom-right)", () => {
		const css = readFileSync(
			resolve(__dirname, "../../src/layouts/C26Layout.module.css"),
			"utf8",
		);
		expect(css).toMatch(/\.article:not\(\[data-source="user"\]\)\s+\.bubble\s*\{[^}]*?border-bottom-left-radius:\s*0/);
		expect(css).toMatch(/\.article\[data-source="user"\]\s+\.bubble\s*\{[^}]*?border-bottom-right-radius:\s*0/);
	});
});
