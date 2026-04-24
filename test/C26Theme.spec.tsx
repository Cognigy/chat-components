import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Message from "../src/messages/Message";
import type { IMessage } from "@cognigy/socket-client";

const botMessage = { text: "Hello", source: "bot" } as IMessage;

describe("C26 Theme", () => {
	it("applies c26 class to article when uiTheme=c26", () => {
		const { container } = render(<Message message={botMessage} uiTheme="c26" />);
		expect(container.querySelector("article")).toHaveClass("c26");
	});

	it("does not apply c26 class without uiTheme prop", () => {
		const { container } = render(<Message message={botMessage} />);
		expect(container.querySelector("article")).not.toHaveClass("c26");
	});

	it("does not apply c26 class when uiTheme is undefined", () => {
		const { container } = render(<Message message={botMessage} uiTheme={undefined} />);
		expect(container.querySelector("article")).not.toHaveClass("c26");
	});
});
