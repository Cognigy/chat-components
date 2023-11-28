import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import audio from "test/fixtures/audio.json";
import { IMessage } from "@cognigy/socket-client";

describe("Message Audio", () => {
	const message = audio as unknown as IMessage;

	it("renders audio message", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByTestId("audio-message")).toBeInTheDocument();
	});

	it("renders audio message with custom skin controls", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByTestId("audio-message").querySelector("audio")).not.toBeVisible();
		expect(screen.getByTestId("audio-controls")).toBeVisible();
	});
});
