/**
 * Gallery / swiper interaction A11y spec (W3C APG carousel pattern).
 *
 * The axe sweep (test/a11y.spec.tsx, "stateful: gallery after slide
 * navigation") only proves the post-navigation DOM has no static ARIA
 * violations. This spec covers the carousel behaviors axe cannot check:
 * named rotation controls, per-slide position labels, the removal of
 * swiper's default aria-live (it would fight the chat log's live region),
 * slide action buttons staying keyboard-reachable across navigation, and
 * keyboard activation of a card's default_action link.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Message from "src/messages/Message";
import { asBot } from "./fixtures/message-cases";
import galleryFixture from "./fixtures/gallery.json";
import { getTabbables } from "./a11y-utils";
import type { IMessage } from "@cognigy/socket-client";

// Total action buttons across the fixture's 8 slides (2 + 0 + 1 + 0 + 2 + 0
// + null + none) — see test/fixtures/gallery.json `_webchat` elements.
const FIXTURE_BUTTON_COUNT = 5;

const slideButtons = (root: ParentNode) =>
	Array.from(root.querySelectorAll<HTMLElement>("button.webchat-carousel-template-button"));

// Single-card generic template whose card carries a default_action URL —
// the shape that renders the card content block as a role="link".
const galleryCardWithLink = (url: string): IMessage =>
	asBot({
		data: {
			_cognigy: {
				_webchat: {
					message: {
						attachment: {
							type: "template",
							payload: {
								template_type: "generic",
								elements: [
									{
										title: "Card with link",
										subtitle: "Card subtitle",
										image_url: "https://placewaifu.com/image/300/300",
										image_alt_text: "a cat",
										buttons: [],
										default_action: { type: "web_url", url },
									},
								],
							},
						},
					},
				},
			},
		},
	});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Gallery Accessibility (W3C APG carousel pattern)", () => {
	it("previous/next rotation controls are buttons with accessible names", () => {
		render(<Message message={asBot(galleryFixture)} />);

		const prev = screen.getByLabelText("Previous slide");
		const next = screen.getByLabelText("Next slide");
		expect(prev.tagName).toBe("BUTTON");
		expect(next.tagName).toBe("BUTTON");
	});

	it("each slide announces its position (Slide X of Y)", () => {
		const { container } = render(<Message message={asBot(galleryFixture)} />);

		const slides = Array.from(container.querySelectorAll(".swiper-slide"));
		expect(slides.length).toBe(8);
		slides.forEach((slide, i) => {
			expect(slide.getAttribute("aria-label")).toBe(`Slide ${i + 1} of ${slides.length}`);
		});
	});

	it("slide position labels honor customTranslations.ariaLabels", () => {
		const config = {
			settings: {
				customTranslations: {
					ariaLabels: {
						slide: "Karte",
						actionButtonPositionText: "{position} von {total}",
					},
				},
			},
		} as unknown as React.ComponentProps<typeof Message>["config"];
		const { container } = render(<Message message={asBot(galleryFixture)} config={config} />);

		const firstSlide = container.querySelector(".swiper-slide");
		expect(firstSlide?.getAttribute("aria-label")).toBe("Karte: 1 von 8");
	});

	it("removes swiper's default aria-live so the gallery cannot fight the chat log's live region", async () => {
		const { container } = render(
			<Message message={asBot(galleryFixture)} data-message-id="gallery-live-region-test" />,
		);

		const wrapper = container.querySelector(".swiper-wrapper");
		expect(wrapper).toBeInTheDocument();
		await waitFor(() => expect(wrapper).not.toHaveAttribute("aria-live"));
	});

	it("slide action buttons stay keyboard-reachable after navigating to the next slide", () => {
		const { container } = render(<Message message={asBot(galleryFixture)} action={vi.fn()} />);

		const tabbableButtons = (root: ParentNode) =>
			getTabbables(root).filter(el => slideButtons(container).includes(el));

		expect(tabbableButtons(container)).toHaveLength(FIXTURE_BUTTON_COUNT);

		fireEvent.click(screen.getByLabelText("Next slide"));

		// Navigation must not knock slides (or their buttons) out of the tab
		// sequence via aria-hidden / tabindex="-1".
		expect(tabbableButtons(container)).toHaveLength(FIXTURE_BUTTON_COUNT);
	});

	it("single-card gallery renders without the carousel chrome and keeps buttons reachable", () => {
		const singleSlide = asBot({
			data: {
				_cognigy: {
					_webchat: {
						message: {
							attachment: {
								type: "template",
								payload: {
									template_type: "generic",
									elements: [
										{
											title: "Only card",
											image_url: "https://placewaifu.com/image/300/300",
											image_alt_text: "a cat",
											buttons: [
												{
													type: "postback",
													payload: "p1",
													title: "Pick me",
												},
											],
										},
									],
								},
							},
						},
					},
				},
			},
		});
		const { container } = render(<Message message={singleSlide} action={vi.fn()} />);

		expect(container.querySelector(".swiper-wrapper")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Next slide")).not.toBeInTheDocument();
		const button = screen.getByRole("button", { name: "Pick me" });
		expect(getTabbables(container)).toContain(button);
	});

	it("card with default_action exposes link semantics with an opens-in-new-tab announcement", () => {
		render(<Message message={galleryCardWithLink("https://example.com")} />);

		const link = screen.getByRole("link");
		// aria-labelledby points at the visible card title; aria-describedby at
		// the subtitle — the link announces as the card, not as a bare URL.
		const titleId = link.getAttribute("aria-labelledby");
		expect(titleId).toBeTruthy();
		expect(document.getElementById(titleId as string)).toHaveTextContent("Card with link");
		const subtitleId = link.getAttribute("aria-describedby");
		expect(document.getElementById(subtitleId as string)).toHaveTextContent("Card subtitle");
		expect(link.getAttribute("aria-label")).toContain("Opens in new tab");
	});

	it("Enter on a card's default_action link opens the (sanitized) URL", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		render(<Message message={galleryCardWithLink("https://example.com")} />);

		const link = screen.getByRole("link");
		fireEvent.keyDown(link, { key: "Enter", code: "Enter", keyCode: 13 });

		// sanitizeUrl normalizes safe URLs (trailing slash) — the call goes
		// through the sanitized value.
		expect(openSpy).toHaveBeenCalledWith("https://example.com/");
	});

	it("Enter on a card whose default_action URL is dangerous does not navigate", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		render(<Message message={galleryCardWithLink("javascript:alert(1)")} />);

		const link = screen.getByRole("link");
		fireEvent.keyDown(link, { key: "Enter", code: "Enter", keyCode: 13 });

		expect(openSpy).not.toHaveBeenCalled();
	});
});
