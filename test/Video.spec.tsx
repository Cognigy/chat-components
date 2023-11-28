import {
	render,
	waitFor,
	screen,
	fireEvent,
	waitForElementToBeRemoved,
} from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import video from "test/fixtures/video.json";
import { WebchatMessage } from "src/messages/types";

describe("Message Video", () => {
	const message = video as unknown as WebchatMessage;

	it("renders video message", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByTestId("video-message")).toBeInTheDocument();
	});

	it("renders video message in preview/poster mode", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(
			screen.getByTestId("video-message").querySelector(".react-player__preview"),
		).toBeVisible();
	});

	it("on click the video is rendered replacing the preview", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(
			screen.getByTestId("video-message").querySelector(".react-player__preview"),
		).toBeVisible();

		fireEvent.click(screen.getByTestId("video-message"));

		waitForElementToBeRemoved(document.querySelector("div.react-player__preview"));

		waitFor(() =>
			expect(screen.getByTestId("video-message").querySelector("video")).toBeInTheDocument(),
		);
	});
});
