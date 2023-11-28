import { render } from "@testing-library/react";
import { it, describe } from "vitest";
import Message from "../src/messages/Message";
import { WebchatMessage } from "src/messages/types";

describe("Message", () => {
	it("renders text message", () => {
		const message = { text: "Hello World", source: "bot" } as WebchatMessage;

		render(<Message message={message} />);
	});
});
