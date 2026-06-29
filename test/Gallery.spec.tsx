import { render } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import gallery from "test/fixtures/gallery.json";
import { IMessage } from "@cognigy/socket-client";
import { IWebchatConfig } from "src/messages/types";

describe("Message Gallery", () => {
	const message = gallery as unknown as IMessage;

	// Opt-in config that moves the card title beneath the image (CSA-85062).
	const titleBelowImageConfig = {
		settings: { layout: { galleryCardTitleBelowImage: true } },
	} as IWebchatConfig;

	it("renders Gallery message", () => {
		const { getByTestId } = render(<Message message={message} />);

		expect(getByTestId("gallery-message")).toBeInTheDocument();
	});

	it("renders images inside gallery", () => {
		const { getAllByAltText } = render(<Message message={message} />);

		expect(getAllByAltText("foobar004g1")).toHaveLength(8);
	});

	it("renders subtitles", () => {
		const { getAllByText } = render(<Message message={message} />);

		expect(getAllByText(/foobar004g2/i)).toHaveLength(3);
	});

	it("renders with navigation arrows", () => {
		const { getByLabelText } = render(<Message message={message} />);

		expect(getByLabelText("Next slide")).toBeVisible();
	});

	it("renders with pagination bullets", () => {
		render(<Message message={message} />);

		expect(document.querySelector(".swiper-pagination")).toBeInTheDocument();
	});

	it("overlays the title on the image by default (no galleryCardTitleBelowImage)", () => {
		const { getByText } = render(<Message message={message} />);

		const title = getByText("Cat 2");

		// Default (legacy) layout: the title lives in the image container, not the
		// content block beneath it.
		const slideContainer = title.closest(".webchat-carousel-template-frame");
		const slideImage = slideContainer?.querySelector('img[alt="foobar004g1"]');
		expect(slideImage).not.toBeNull();
		// Title shares the same container as the image (the overlay `.top` block)...
		expect(title.parentElement?.contains(slideImage!)).toBe(true);
		// ...and is not inside the text content block.
		expect(title.closest(".webchat-carousel-template-content")).toBeNull();
	});

	it("renders the title below the image when galleryCardTitleBelowImage is enabled", () => {
		const { getByText } = render(<Message message={message} config={titleBelowImageConfig} />);

		const title = getByText("Cat 2");
		const contentBlock = title.closest(".webchat-carousel-template-content");

		// Title must live in the text content block beneath the image...
		expect(contentBlock).not.toBeNull();
		// ...and the slide's main image (identified by its alt text) must not be a descendant
		// of that block — i.e. the title is not overlaying the image. Scoped to alt text so
		// the assertion survives ActionButtons rendering its own <img> elements in future.
		const slideContainer = title.closest(".webchat-carousel-template-frame");
		const slideImage = slideContainer?.querySelector('img[alt="foobar004g1"]');
		expect(slideImage).not.toBeNull();
		expect(contentBlock?.contains(slideImage!)).toBe(false);
	});

	it("renders the title below the image even when there is no subtitle or buttons", () => {
		const { getByText } = render(<Message message={message} config={titleBelowImageConfig} />);

		const title = getByText("Cat 8");

		expect(title.closest(".webchat-carousel-template-content")).not.toBeNull();
	});
});
