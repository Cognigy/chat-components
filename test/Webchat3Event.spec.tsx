import { render, waitFor } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import event from "test/fixtures/webchat3Event.json";
import { IMessage } from "@cognigy/socket-client";

describe("Webchat3 Event", () => {
	const message = event as unknown as IMessage;

	it("renders _webchat3 event", async () => {
		const { getByText } = render(<Message message={message} />);

		await waitFor(() => {
			expect(getByText("Agent joined")).toBeInTheDocument();
		});
	});
});
