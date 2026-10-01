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
import videoDownloadUrl from "test/fixtures/video-download-url.json";
import { IMessage } from "@cognigy/socket-client";

describe("Message Video", () => {
	const message = video as unknown as IMessage;
	const messageDownloadUrl = videoDownloadUrl as unknown as IMessage;

	it("renders video message", async () => {
		render(<Message message={message} />);

		await waitFor(() => {
			expect(screen.getByTestId("video-message")).toBeInTheDocument();
		});
	});

	it("renders video message in preview/poster mode", async () => {
		render(<Message message={message} />);

		await waitFor(() => {
			expect(
				screen.getByTestId("video-message").querySelector(".react-player__preview"),
			).toBeVisible();
		});
	});

	it("on click the video is rendered replacing the preview", async () => {
		render(<Message message={message} />);

		await waitFor(() => {
			expect(
				screen.getByTestId("video-message").querySelector(".react-player__preview"),
			).toBeVisible();
		});

		fireEvent.click(screen.getByTestId("video-message"));

		waitForElementToBeRemoved(document.querySelector("div.react-player__preview"));

		waitFor(() =>
			expect(screen.getByTestId("video-message").querySelector("video")).toBeInTheDocument(),
		);
	});

	it("prefers downloadUrl over url when both are present", async () => {
		render(<Message message={messageDownloadUrl} />);

		await waitFor(() => {
			expect(screen.getByTestId("video-message").querySelector("[data-url]")).toHaveAttribute(
				"data-url",
				"https://download.example.com/video.mp4",
			);
		});
	});
});
