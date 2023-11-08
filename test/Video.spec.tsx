import {
	render,
	waitFor,
	screen,
	fireEvent,
	waitForElementToBeRemoved,
} from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/Message";
import video from "test/fixtures/video.json";

describe("Message Video", () => {
	it("renders video message", async () => {
		await waitFor(() => {
			render(<Message message={video} />);
		});

		expect(screen.getByTestId("video-message")).toBeInTheDocument();
	});

	it("renders video message in preview/poster mode", async () => {
		await waitFor(() => {
			render(<Message message={video} />);
		});

		expect(
			screen.getByTestId("video-message").querySelector(".react-player__preview"),
		).toBeVisible();
	});

	it("on click the video is rendered replacing the preview", async () => {
		await waitFor(() => {
			render(<Message message={video} />);
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
