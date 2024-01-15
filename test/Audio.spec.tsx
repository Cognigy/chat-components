import { render, waitFor } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import audio from "test/fixtures/audio.json";
import { IMessage } from "@cognigy/socket-client";

describe("Message Audio", () => {
	const message = audio as unknown as IMessage;

	it("renders audio message", async () => {
		const { getByTestId } = render(<Message message={message} />);

		await waitFor(() => {
			expect(getByTestId("audio-message")).toBeInTheDocument();
		});
	});

	it("renders audio message with custom skin controls", async () => {
		const { getByTestId } = render(<Message message={message} />);

		await waitFor(() => {
			expect(getByTestId("audio-message").querySelector("audio")).not.toBeVisible();
			expect(getByTestId("audio-controls")).toBeVisible();
		});
	});
});
