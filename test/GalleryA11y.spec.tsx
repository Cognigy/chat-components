import { render } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import gallery from "test/fixtures/gallery.json";
import { IMessage } from "@cognigy/socket-client";

const galleryMessage = { ...gallery, source: "bot" } as unknown as IMessage;

// jsdom has no layout, so Swiper "locks" its controls (tabindex="-1",
// swiper-button-lock) as if all slides fit the zero-width viewport. Real
// Tab-order simulation is therefore impossible here; instead we assert the
// DOM order of the focusable regions, which is what determines tab order in
// a real browser (none of these elements carry a positive tabindex).
const precedes = (a: Element, b: Element) =>
	Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("Gallery carousel focus order (WCAG 2.4.3, CGY-3277)", () => {
	it("orders the DOM as slides → prev/next buttons → pagination dots", () => {
		const { container } = render(<Message message={galleryMessage} />);

		const slides = container.querySelector(".swiper-wrapper");
		const prev = container.querySelector(".gallery-button-prev");
		const next = container.querySelector(".gallery-button-next");
		const pagination = container.querySelector(".swiper-pagination");

		expect(slides).not.toBeNull();
		expect(prev).not.toBeNull();
		expect(next).not.toBeNull();
		expect(pagination).not.toBeNull();

		// Visual layout: prev/next sit adjacent to the slides, above the dots.
		// Tab order must match: slide content → prev/next → dots — not the
		// pre-fix order where Swiper injected the dots before the buttons.
		expect(precedes(slides!, prev!)).toBe(true);
		expect(precedes(prev!, next!)).toBe(true);
		expect(precedes(next!, pagination!)).toBe(true);
	});

	it("keeps the clickable pagination dots and labelled nav buttons", () => {
		const { container, getByLabelText } = render(<Message message={galleryMessage} />);

		// The custom pagination element must still be adopted by Swiper's
		// Pagination module (bullets rendered inside it, clickable modifier).
		const pagination = container.querySelector(".gallery-pagination");
		expect(pagination?.classList.contains("swiper-pagination-clickable")).toBe(true);
		expect(pagination?.querySelectorAll(".swiper-pagination-bullet").length).toBeGreaterThan(0);

		// Swiper's A11y module names the nav buttons (checked by the axe gate too).
		expect(getByLabelText("Previous slide")).toBeInTheDocument();
		expect(getByLabelText("Next slide")).toBeInTheDocument();
	});
});
