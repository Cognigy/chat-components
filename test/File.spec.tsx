import { render, screen, waitFor } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import file from "test/fixtures/file.json";
import fileDownloadUrl from "test/fixtures/file-download-url.json";
import { IMessage } from "@cognigy/socket-client";

describe("Message File", () => {
	const message = file as unknown as IMessage;
	const messageDownloadUrl = fileDownloadUrl as unknown as IMessage;

	it("renders file message", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getAllByTestId("image-message").length).toBeGreaterThan(0);
	});

	it("falls back to url when downloadUrl is absent", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const link = screen.getAllByTestId("image-message")[0].closest("a");
		expect(link).toHaveAttribute("href", "https://placewaifu.com/image/300/300");
	});

	it("prefers downloadUrl over url for an image-type file attachment", async () => {
		await waitFor(() => {
			render(<Message message={messageDownloadUrl} />);
		});

		const imageEl = screen.getByTestId("image-message");
		expect(imageEl).toHaveAttribute("src", "https://download.example.com/image.png");
		expect(imageEl.closest("a")).toHaveAttribute(
			"href",
			"https://download.example.com/image.png",
		);
	});

	it("resolves each non-image attachment independently within the same message", async () => {
		await waitFor(() => {
			render(<Message message={messageDownloadUrl} />);
		});

		const fileLinks = screen.getAllByTestId("file-message").map(el => el.closest("a"));
		// download-url-pdf (has downloadUrl) and legacy-only-pdf (no downloadUrl), in
		// array order — one item's downloadUrl must not leak into the other's resolution.
		expect(fileLinks[0]).toHaveAttribute("href", "https://download.example.com/file.pdf");
		expect(fileLinks[1]).toHaveAttribute("href", "https://legacy.example.com/legacy-only.pdf");
	});
});
