/**
 * Image lightbox interaction A11y spec (W3C APG dialog pattern).
 *
 * The axe sweep (test/a11y.spec.tsx, "stateful: image lightbox open") only
 * proves the open lightbox has no static ARIA violations — axe cannot press
 * keys. This spec covers the dialog behaviors the pattern requires:
 * keyboard-openable trigger, accessible dialog name, focus moved into the
 * dialog on open, named header controls, Escape/Enter close paths, and
 * focus restored to the trigger on close (src/messages/Image/Image.tsx).
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Message from "src/messages/Message";
import { asBot } from "./fixtures/message-cases";
import imageDownloadableFixture from "./fixtures/image-downloadable.json";
import imageFixture from "./fixtures/image.json";
import { getTabbables } from "./a11y-utils";

const IMAGE_URL = "https://placewaifu.com/image/600/600";

const renderDownloadableImage = () => render(<Message message={asBot(imageDownloadableFixture)} />);

const openLightbox = async () => {
	const trigger = screen.getByTestId("image-message");
	fireEvent.click(trigger);
	const dialog = await screen.findByRole("dialog");
	return { trigger, dialog };
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Image lightbox Accessibility (W3C APG dialog pattern)", () => {
	it("trigger: downloadable image thumb is a named button in the tab order", () => {
		renderDownloadableImage();

		const trigger = screen.getByTestId("image-message");
		expect(trigger).toHaveAttribute("role", "button");
		expect(trigger).toHaveAttribute("tabindex", "0");
		expect(trigger).toHaveAccessibleName("View full-size image");
	});

	it("trigger: non-downloadable image exposes no button semantics and is not focusable", () => {
		render(<Message message={asBot(imageFixture)} />);

		const thumb = screen.getByTestId("image-message");
		expect(thumb).not.toHaveAttribute("role");
		expect(thumb).toHaveAttribute("tabindex", "-1");
	});

	it("Enter on the trigger opens the dialog with an accessible name", async () => {
		renderDownloadableImage();

		const trigger = screen.getByTestId("image-message");
		trigger.focus();
		fireEvent.keyDown(trigger, { key: "Enter", code: "Enter", keyCode: 13 });

		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveAccessibleName("Full-size image viewer");
	});

	it("Space on the trigger also opens the dialog", async () => {
		renderDownloadableImage();

		const trigger = screen.getByTestId("image-message");
		trigger.focus();
		fireEvent.keyDown(trigger, { key: " ", code: "Space", keyCode: 32 });

		expect(await screen.findByRole("dialog")).toBeInTheDocument();
	});

	it("moves focus into the dialog on open (download button)", async () => {
		renderDownloadableImage();
		await openLightbox();

		const download = screen.getByRole("button", { name: "Download full-size image" });
		await waitFor(() => expect(download).toHaveFocus());
	});

	it("header controls are named buttons and the dialog's only tab stops", async () => {
		renderDownloadableImage();
		const { dialog } = await openLightbox();

		const download = screen.getByRole("button", { name: "Download full-size image" });
		const close = screen.getByRole("button", { name: "Close full-size image viewer" });
		expect(getTabbables(dialog)).toEqual([download, close]);
	});

	it("Tab from the close button wraps back to the download button (focus trap)", async () => {
		renderDownloadableImage();
		await openLightbox();

		const download = screen.getByRole("button", { name: "Download full-size image" });
		const close = screen.getByRole("button", { name: "Close full-size image viewer" });
		close.focus();
		fireEvent.keyDown(close, { key: "Tab", code: "Tab", keyCode: 9 });

		expect(download).toHaveFocus();
	});

	it("Escape closes the dialog and returns focus to the trigger", async () => {
		renderDownloadableImage();
		const { trigger } = await openLightbox();

		fireEvent.keyDown(document.body, { key: "Escape", code: "Escape", keyCode: 27 });

		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		expect(trigger).toHaveFocus();
	});

	it("Enter on the close button closes the dialog and returns focus to the trigger", async () => {
		renderDownloadableImage();
		const { trigger } = await openLightbox();

		const close = screen.getByRole("button", { name: "Close full-size image viewer" });
		close.focus();
		fireEvent.keyDown(close, { key: "Enter", code: "Enter", keyCode: 13 });

		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		expect(trigger).toHaveFocus();
	});

	it("Enter on the download button opens the full-size image in a new tab", async () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		renderDownloadableImage();
		await openLightbox();

		const download = screen.getByRole("button", { name: "Download full-size image" });
		download.focus();
		fireEvent.keyDown(download, { key: "Enter", code: "Enter", keyCode: 13 });

		expect(openSpy).toHaveBeenCalledWith(IMAGE_URL, "_blank");
	});

	it("full-size image keeps the message's alt text", async () => {
		renderDownloadableImage();
		await openLightbox();

		// The fixture's altText is "" — the full-size img must still render an
		// explicit (empty) alt so it is not announced by its URL.
		const img = document.querySelector("[data-test='image-lightbox']");
		expect(img).toHaveAttribute("alt");
	});
});
