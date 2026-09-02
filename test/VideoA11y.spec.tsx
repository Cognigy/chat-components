/**
 * Video player interaction A11y spec.
 *
 * ReactPlayer's light-mode preview cannot carry a role, so the wrapper div
 * implements the play button (role/tabindex/aria-label + Enter/Space) — see
 * the comment in src/messages/Video/Video.tsx. This spec locks in those
 * button semantics, the handoff out of the tab order once playback starts,
 * and the transcript download path (visible named button + hidden anchor
 * kept out of the accessibility tree).
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Message from "src/messages/Message";
import { asBot } from "./fixtures/message-cases";
import videoFixture from "./fixtures/video.json";
import videoAltTextFixture from "./fixtures/videoWithAltText.json";
import { getTabbables } from "./a11y-utils";

const renderVideo = async () => {
	const utils = render(<Message message={asBot(videoFixture)} />);
	await waitFor(() => expect(screen.getByTestId("video-message")).toBeInTheDocument());
	return utils;
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Video Accessibility (preview play button)", () => {
	it("preview wrapper is a named play button in the tab order", async () => {
		await renderVideo();

		const wrapper = screen.getByTestId("video-message");
		expect(wrapper).toHaveAttribute("role", "button");
		expect(wrapper).toHaveAttribute("tabindex", "0");
		expect(wrapper).toHaveAccessibleName("Play video");
	});

	it("play button label honors customTranslations.ariaLabels.playVideo", async () => {
		const config = {
			settings: { customTranslations: { ariaLabels: { playVideo: "Video abspielen" } } },
		} as unknown as React.ComponentProps<typeof Message>["config"];
		render(<Message message={asBot(videoFixture)} config={config} />);

		await waitFor(() =>
			expect(screen.getByTestId("video-message")).toHaveAccessibleName("Video abspielen"),
		);
	});

	it("Enter starts playback and hands the wrapper's button role off to the real player", async () => {
		await renderVideo();

		const wrapper = screen.getByTestId("video-message");
		wrapper.focus();
		fireEvent.keyDown(wrapper, { key: "Enter", code: "Enter", keyCode: 13 });

		// Once playing, the wrapper must stop announcing as a button and leave
		// the tab order — keyboard access moves to the native <video controls>.
		await waitFor(() => expect(wrapper).not.toHaveAttribute("role"));
		expect(wrapper).toHaveAttribute("tabindex", "-1");
	});

	it("Space also starts playback", async () => {
		await renderVideo();

		const wrapper = screen.getByTestId("video-message");
		wrapper.focus();
		fireEvent.keyDown(wrapper, { key: " ", code: "Space", keyCode: 32 });

		await waitFor(() => expect(wrapper).not.toHaveAttribute("role"));
	});
});

describe("Video Accessibility (transcript download)", () => {
	it("renders a visible, named transcript button; the data-URI anchor stays out of the a11y tree", async () => {
		const { container } = render(<Message message={asBot(videoAltTextFixture)} />);

		const button = await screen.findByRole("button", { name: "Download Transcript" });
		expect(getTabbables(container)).toContain(button);

		// The anchor is a programmatic download target only.
		const anchor = container.querySelector("a[download]");
		expect(anchor).toHaveAttribute("aria-hidden", "true");
		expect(getTabbables(container)).not.toContain(anchor);
	});
});
