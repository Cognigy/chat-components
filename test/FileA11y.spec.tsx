/**
 * File attachment interaction A11y spec.
 *
 * File attachments render as plain anchors (no custom key handling), so the
 * contract to lock in is: every attachment is a link in the tab order with
 * an accessible name that carries the file name and human-readable size —
 * image previews via their alt text, non-image tiles via visible text.
 */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Message from "src/messages/Message";
import { asBot } from "./fixtures/message-cases";
import fileFixture from "./fixtures/file.json";
import { getTabbables } from "./a11y-utils";

describe("File Accessibility (attachment links)", () => {
	it("every attachment is an anchor with an href, in the tab order", () => {
		const { container } = render(<Message message={asBot(fileFixture)} />);

		// file.json: 3 PDF tiles + 3 image previews.
		const anchors = Array.from(container.querySelectorAll<HTMLElement>("a[href]"));
		expect(anchors).toHaveLength(6);

		const tabbables = getTabbables(container);
		anchors.forEach(anchor => expect(tabbables).toContain(anchor));
	});

	it("image previews are named by alt text with file name and size", () => {
		const { container } = render(<Message message={asBot(fileFixture)} />);

		const previews = Array.from(
			container.querySelectorAll<HTMLImageElement>(
				".webchat-media-template-image-container img",
			),
		);
		expect(previews).toHaveLength(3);
		previews.forEach(img => {
			expect(img.alt).toContain("Screenshot from 2024-01-24 10-28-43 - overflow.png");
			expect(img.alt).toMatch(/\(\d+(\.\d+)? KB\)/);
		});
	});

	it("non-image tiles expose file name, extension and size as text", () => {
		const { container } = render(<Message message={asBot(fileFixture)} />);

		const tiles = Array.from(
			container.querySelectorAll<HTMLElement>("[data-testid='file-message']"),
		);
		expect(tiles).toHaveLength(3);
		expect(tiles[0].textContent).toContain("sample");
		expect(tiles[0].textContent).toContain(".pdf");
		expect(tiles[0].textContent).toMatch(/\d+(\.\d+)? KB/);
	});
});
