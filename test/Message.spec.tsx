import { render } from "@testing-library/react";
import { it, describe } from "vitest";
import Message from "../src/Message";

describe("Message", () => {
	it("renders text message", () => {
		const message = { text: "Hello World", source: "bot" };

		render(<Message message={message} />);
	});
});
