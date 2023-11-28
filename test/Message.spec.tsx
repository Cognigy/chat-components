import { render } from "@testing-library/react";
import { it, describe } from "vitest";
import Message from "../src/messages/Message";
import { IMessage } from "@cognigy/socket-client";

describe("Message", () => {
	it("renders text message", () => {
		const message = { text: "Hello World", source: "bot" } as IMessage;

		render(<Message message={message} />);
	});
});
