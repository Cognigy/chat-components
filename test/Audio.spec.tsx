import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/Message";
import audio from "test/fixtures/audio.json";

describe("Message Audio", () => {
	it("renders audio message", async () => {
		await waitFor(() => {
			render(<Message message={audio} />);
		});

		expect(screen.getByTestId("audio-message")).toBeInTheDocument();
	});

	it("renders audio message with custom skin controls", async () => {
		await waitFor(() => {
			render(<Message message={audio} />);
		});

		expect(screen.getByTestId("audio-message").querySelector("audio")).not.toBeVisible();
		expect(screen.getByTestId("audio-controls")).toBeVisible();
	});
});
