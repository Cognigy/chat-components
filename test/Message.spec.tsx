import { render, screen } from "@testing-library/react";
import { it, describe } from "vitest";
import Message from "../src/Message";

describe("Message", () => {
	it("renders text message", () => {
		const message = { text: "Hello World" };

		render(<Message source="bot" message={message} />);

		// screen.debug();
	});
});
