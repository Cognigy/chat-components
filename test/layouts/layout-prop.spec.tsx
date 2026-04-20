import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Message from "../../src/messages/Message";
import { botTextMessage } from "../fixtures/layout-messages";

describe("layout prop — equivalence", () => {
	it('<Message> without layout renders identical DOM to <Message layout="webchat">', () => {
		const { container: defaultContainer } = render(<Message message={botTextMessage} />);
		const { container: explicitContainer } = render(
			<Message message={botTextMessage} layout="webchat" />,
		);
		expect(defaultContainer.innerHTML).toBe(explicitContainer.innerHTML);
	});

	it('<Message layout="webchat"> does NOT set data-layout attribute on article', () => {
		const { container } = render(<Message message={botTextMessage} layout="webchat" />);
		const article = container.querySelector("article");
		expect(article).not.toHaveAttribute("data-layout");
	});

	it('<Message layout="c26"> throws pending c26 implementation', () => {
		// Silence expected error log during throw assertion
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() =>
			render(<Message message={botTextMessage} layout="c26" />),
		).toThrowError(/c26 layout not yet implemented/);
		spy.mockRestore();
	});
});
