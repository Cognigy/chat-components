/**
 * Gallery / swiper interaction A11y spec (W3C APG carousel pattern).
 *
 * The axe sweep (test/a11y.spec.tsx, "stateful: gallery after slide
 * navigation") only proves the post-navigation DOM has no static ARIA
 * violations. This spec covers the carousel behaviors axe cannot check:
 * named rotation controls, per-slide position labels, the removal of
 * swiper's default aria-live (it would fight the chat log's live region),
 * slide action buttons staying keyboard-reachable across navigation,
 * keyboard activation of a card's default_action link, and the DOM/focus
 * order of the carousel chrome (slides → prev/next → dots, CGY-3277).
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
// the shape that renders a role="link" for the card (CGY-37634: the link
// wraps the card text and never contains the card's buttons).
const galleryCardWithLink = (
	url: string,
	{
		title = "Card with link",
		subtitle = "Card subtitle",
		image_alt_text = "a cat",
		buttons = [],
	}: {
		title?: string;
		subtitle?: string;
		image_alt_text?: string;
		buttons?: unknown[];
	} = {},
): IMessage =>
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
										title,
										subtitle,
										image_url: "https://placewaifu.com/image/300/300",
										image_alt_text,
										buttons,
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

// jsdom has no layout, so Swiper "locks" its controls (tabindex="-1",
// swiper-button-lock) as if all slides fit the zero-width viewport. Real
// Tab-order simulation is therefore impossible here; instead we assert the
// DOM order of the focusable regions, which is what determines tab order in
// a real browser (none of these elements carry a positive tabindex).
const precedes = (a: Element, b: Element) =>
	Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

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

	it("card with default_action is a tab stop whose accessible name is the title plus the new-tab hint", () => {
		const { container } = render(
			<Message message={galleryCardWithLink("https://example.com")} />,
		);

		const link = screen.getByRole("link");
		// The link block must be a tab stop — it renders role="link" with an
		// Enter handler, and a mouse user can click it (WCAG 2.1.1, CGY-37634).
		expect(link).toHaveAttribute("tabindex", "0");
		expect(getTabbables(container)).toContain(link);
		// The computed *name* (not just an attribute) must carry both the card
		// title and the new-tab hint: aria-labelledby alongside aria-label wins
		// the accessible-name computation and drops the hint. The subtitle is
		// the description.
		expect(link).toHaveAccessibleName("Card with link. Opens in new tab");
		expect(link).toHaveAccessibleDescription("Card subtitle");
		expect(link).not.toHaveAttribute("aria-labelledby");
	});

	it("the new-tab hint honors customTranslations.ariaLabels.opensInNewTab", () => {
		const config = {
			settings: {
				customTranslations: { ariaLabels: { opensInNewTab: "Öffnet in neuem Tab" } },
			},
		} as unknown as React.ComponentProps<typeof Message>["config"];
		render(<Message message={galleryCardWithLink("https://example.com")} config={config} />);

		expect(screen.getByRole("link")).toHaveAccessibleName(
			"Card with link. Öffnet in neuem Tab",
		);
	});

	it("link name is plain text even when the title carries HTML", () => {
		render(
			<Message
				message={galleryCardWithLink("https://example.com", {
					title: "<b>Sale</b> &amp; <i>more</i>",
				})}
			/>,
		);

		const link = screen.getByRole("link");
		// The visible title keeps its markup…
		expect(document.querySelector(".webchat-carousel-template-title b")).not.toBeNull();
		// …but aria-label must not announce literal tags or entities (4.1.2).
		expect(link).toHaveAccessibleName("Sale & more. Opens in new tab");
	});

	it("card buttons are siblings of the default_action link, never nested inside it", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		const { container } = render(
			<Message
				message={galleryCardWithLink("https://example.com", {
					buttons: [{ type: "postback", payload: "p1", title: "Pick me" }],
				})}
				action={vi.fn()}
			/>,
		);

		const link = screen.getByRole("link");
		const button = screen.getByRole("button", { name: "Pick me" });
		// A link must not contain interactive descendants (HTML content model);
		// both remain separate tab stops in DOM order: link text, then button.
		expect(link.contains(button)).toBe(false);
		expect(link.querySelector("button")).toBeNull();
		const tabbables = getTabbables(container);
		expect(tabbables.indexOf(link)).toBeGreaterThanOrEqual(0);
		expect(tabbables.indexOf(button)).toBe(tabbables.indexOf(link) + 1);

		// Enter on the button used to bubble to the card's Enter handler and
		// open the default_action URL as well.
		button.focus();
		fireEvent.keyDown(button, { key: "Enter", code: "Enter", keyCode: 13 });
		expect(openSpy).not.toHaveBeenCalled();
	});

	it("card with default_action but no text below the image makes the image area the link", () => {
		render(
			<Message
				message={galleryCardWithLink("https://example.com", {
					subtitle: "",
					buttons: [{ type: "postback", payload: "p1", title: "Pick me" }],
				})}
			/>,
		);

		const link = screen.getByRole("link");
		// Nothing in the content block to wrap (overlay title, no subtitle), so
		// the link is the image + title area — a visible, focusable target that
		// still excludes the button.
		expect(link.querySelector("img")).not.toBeNull();
		expect(link.querySelector("h4")).toHaveTextContent("Card with link");
		expect(link.querySelector("button")).toBeNull();
		expect(link).toHaveAttribute("tabindex", "0");
		expect(link).toHaveAccessibleName("Card with link. Opens in new tab");
		// No subtitle → nothing to describe the link with (no dangling id ref).
		expect(link).not.toHaveAttribute("aria-describedby");
	});

	it("title-less card falls back to the image alt text for the link name (WCAG 2.4.4)", () => {
		render(
			<Message
				message={galleryCardWithLink("https://example.com", {
					title: "",
					subtitle: "",
					buttons: [{ type: "postback", payload: "p1", title: "Pick me" }],
				})}
			/>,
		);

		// aria-label overrides the image's alt, so the alt must be folded into
		// the label; a name of ". Opens in new tab" (stray period plus hint)
		// has no link purpose (WCAG 2.4.4).
		expect(screen.getByRole("link")).toHaveAccessibleName("a cat. Opens in new tab");
	});

	it("card with neither title nor image alt is named by the destination host", () => {
		render(
			<Message
				message={galleryCardWithLink("https://example.com/some/path?q=1", {
					title: "",
					subtitle: "",
					image_alt_text: "",
				})}
			/>,
		);

		// The destination is the only purpose-bearing information left; the
		// role already conveys "link", so no generic label is added.
		expect(screen.getByRole("link")).toHaveAccessibleName("example.com. Opens in new tab");
	});

	it("card with no text, no alt and a non-http URL keeps only the new-tab hint as its name", () => {
		render(
			<Message
				message={galleryCardWithLink("javascript:alert(1)", {
					title: "",
					subtitle: "",
					image_alt_text: "",
				})}
			/>,
		);

		// Sanitization turns the URL into about:blank (activation is a no-op),
		// so there is no host to name; the name must still be non-empty and
		// must not start with a stray separator.
		expect(screen.getByRole("link")).toHaveAccessibleName("Opens in new tab");
	});

	it("subtitle-only card is named by its subtitle, which is then not also its description", () => {
		render(
			<Message
				message={galleryCardWithLink("https://example.com", {
					title: "",
					subtitle: "Only a subtitle",
				})}
			/>,
		);

		const link = screen.getByRole("link");
		// The subtitle is the link's only visible text (Label in Name, 2.5.3);
		// repeating it as the description would announce it twice.
		expect(link).toHaveAccessibleName("Only a subtitle. Opens in new tab");
		expect(link).not.toHaveAttribute("aria-describedby");
		expect(link.querySelector(".webchat-carousel-template-subtitle")).not.toBeNull();
	});

	it("a subtitle that sanitizes to empty renders no invisible link and no content block", () => {
		const { container } = render(
			<Message
				message={galleryCardWithLink("https://example.com", {
					subtitle: "<script>alert(1)</script>",
				})}
			/>,
		);

		// The raw subtitle is truthy but strips to "". A guard on the raw value
		// yields a zero-height, empty, focusable text link plus a dangling
		// aria-describedby (WCAG 2.4.7 / 2.4.3); like the title guard, the card
		// must behave as if it had no subtitle, so the image area is the link.
		expect(container.querySelector(".webchat-carousel-template-content")).toBeNull();
		expect(container.querySelector(".webchat-carousel-template-subtitle")).toBeNull();
		const link = screen.getByRole("link");
		expect(link.querySelector("img")).not.toBeNull();
		expect(link).not.toHaveAttribute("aria-describedby");
		expect(link).toHaveAccessibleName("Card with link. Opens in new tab");
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

	it("honors disableUrlButtonSanitization: the default_action URL opens as authored", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		const config = {
			settings: { layout: { disableUrlButtonSanitization: true } },
		} as unknown as React.ComponentProps<typeof Message>["config"];
		render(<Message message={galleryCardWithLink("https://example.com")} config={config} />);

		fireEvent.click(screen.getByRole("link"));

		// With sanitization enabled sanitizeUrl normalizes this to a trailing
		// slash (see the Enter test); the opt-out passes the raw value through.
		expect(openSpy).toHaveBeenCalledWith("https://example.com");
	});

	it("card without a default_action URL is not a tab stop and has no link role", () => {
		const { container } = render(<Message message={asBot(galleryFixture)} />);

		// gallery.json cards have buttons but no default_action — the content
		// blocks must stay plain containers, so only the buttons/chrome are
		// tabbable.
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		const contentBlocks = container.querySelectorAll(".webchat-carousel-template-content");
		expect(contentBlocks.length).toBeGreaterThan(0);
		contentBlocks.forEach(block => expect(block).not.toHaveAttribute("tabindex"));
	});

	it("autofocus lands on the image-area link of a title-only default_action card", async () => {
		// Gallery's enableAutoFocus effect only fires when focus is already in
		// the chat log, and it must find the first card via the message root: a
		// card with an overlay title and no subtitle/buttons has no content
		// block, so a lookup by content id cannot find its link.
		const chatLog = document.createElement("div");
		chatLog.id = "webchatChatHistoryWrapperLiveLogPanel";
		const previous = document.createElement("button");
		chatLog.appendChild(previous);
		// Mount the message in its own node so React's root does not disturb
		// the focused sibling.
		const mount = document.createElement("div");
		chatLog.appendChild(mount);
		document.body.appendChild(chatLog);
		previous.focus();
		const config = {
			settings: { widgetSettings: { enableAutoFocus: true } },
		} as unknown as React.ComponentProps<typeof Message>["config"];

		try {
			render(
				<Message
					message={galleryCardWithLink("https://example.com", { subtitle: "" })}
					config={config}
					data-message-id="gallery-autofocus-test"
				/>,
				{ container: mount },
			);

			const link = screen.getByRole("link");
			expect(link.querySelector("img")).not.toBeNull();
			await waitFor(() => expect(link).toHaveFocus(), { timeout: 1000 });
		} finally {
			chatLog.remove();
		}
	});

	it("autofocus without a message id falls back to the content-id lookup", async () => {
		// Consumers that render <Message> without data-message-id still get
		// autofocus for cards that have a content block: the first card is
		// found through its content id instead of the message root.
		const chatLog = document.createElement("div");
		chatLog.id = "webchatChatHistoryWrapperLiveLogPanel";
		const previous = document.createElement("button");
		chatLog.appendChild(previous);
		const mount = document.createElement("div");
		chatLog.appendChild(mount);
		document.body.appendChild(chatLog);
		previous.focus();
		const config = {
			settings: { widgetSettings: { enableAutoFocus: true } },
		} as unknown as React.ComponentProps<typeof Message>["config"];

		try {
			render(
				<Message message={galleryCardWithLink("https://example.com")} config={config} />,
				{
					container: mount,
				},
			);

			const link = screen.getByRole("link");
			expect(link.closest(".webchat-carousel-template-content")).not.toBeNull();
			await waitFor(() => expect(link).toHaveFocus(), { timeout: 1000 });
		} finally {
			chatLog.remove();
		}
	});

	it("Enter on a card whose default_action URL is dangerous does not navigate", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		render(<Message message={galleryCardWithLink("javascript:alert(1)")} />);

		const link = screen.getByRole("link");
		fireEvent.keyDown(link, { key: "Enter", code: "Enter", keyCode: 13 });

		expect(openSpy).not.toHaveBeenCalled();
	});
});

describe("Gallery carousel focus order (WCAG 2.4.3, CGY-3277)", () => {
	it("orders the DOM as slides → prev/next buttons → pagination dots", () => {
		const { container } = render(<Message message={asBot(galleryFixture)} />);

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
		const { container } = render(<Message message={asBot(galleryFixture)} />);

		// The custom pagination element must still be adopted by Swiper's
		// Pagination module (bullets rendered inside it, clickable modifier).
		const pagination = container.querySelector(".gallery-pagination");
		expect(pagination).not.toBeNull();
		expect(pagination!.classList.contains("swiper-pagination-clickable")).toBe(true);
		expect(pagination!.querySelectorAll(".swiper-pagination-bullet").length).toBeGreaterThan(0);

		// Swiper's A11y module names the nav buttons (checked by the axe gate too).
		expect(screen.getByLabelText("Previous slide")).toBeInTheDocument();
		expect(screen.getByLabelText("Next slide")).toBeInTheDocument();
	});
});
