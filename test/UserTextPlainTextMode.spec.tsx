import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Message } from "src/index";
import { IWebchatConfig } from "src/messages/types";
import { escapeHtml, plainTextToHtml } from "src/utils";
import { IMessage } from "@cognigy/socket-client";
import file from "test/fixtures/file.json";

/**
 * Regression guard for CGY-36060 / CGY-40199.
 *
 * With `widgetSettings.disableHtmlInput` (the Webchat default), user input is
 * plain text. Webchat sends it to the endpoint unescaped, so a typed `&` stays
 * `&` for flows, intents and logs. Webchat v3.48.0 escaped the text before
 * sending instead: every `&` arrived as `&amp;` and broke "Trigger Intent"
 * buttons such as `cIntent:Tools & Access`.
 *
 * Escaping therefore lives here, at render time. Without it, a user message
 * like `<img src=x onerror=…>` (sent by typing `&#60;img…&#62;`) would render
 * as a live element, both live and when replayed from history. These tests pin
 * both halves: text displays literally, and no markup ever becomes an element.
 */

const config = (widgetSettings: NonNullable<IWebchatConfig["settings"]>["widgetSettings"]) =>
	({ settings: { widgetSettings } }) as IWebchatConfig;

const plainTextMode = config({ disableHtmlInput: true });

const renderUserMessage = (text: string, webchatConfig: IWebchatConfig = plainTextMode) =>
	render(<Message message={{ text, source: "user" }} config={webchatConfig} />);

const bubbleText = (container: HTMLElement) => container.querySelector("p")?.textContent;

describe("user text with disableHtmlInput (plain text mode)", () => {
	// Display guards: the bubble shows exactly what the user typed. DOMPurify
	// alone also gets these right, so they protect against a broken escape
	// (for example double escaping), not against a missing one.
	test.each(["foo & bar", "cIntent:Tools & Access", "a < b & c", "I <3 you"])(
		"displays %s literally",
		text => {
			const { container } = renderUserMessage(text);
			expect(bubbleText(container)).toBe(text);
		},
	);

	// Webchat sends entity-encoded input decoded (PR #294 payload), so the text
	// can contain real markup characters. Rendering it as HTML would create a
	// live element, so it must stay text.
	test.each([
		["<img src=x onerror=alert(1)>", "img"],
		["<b>bold</b>", "b"],
		['<iframe src="https://evil.example"></iframe>', "iframe"],
		['<a href="https://evil.example">click</a>', "a"],
	])("renders %s as text, never as a <%s> element", (text, tag) => {
		const { container } = renderUserMessage(text);
		expect(container.querySelector(tag)).toBeNull();
		expect(bubbleText(container)).toBe(text);
	});

	// The escaping is safe on its own: it must still hold when the consumer
	// turns off render-time sanitization for user messages.
	test("keeps markup inert even with disableTextInputSanitization", () => {
		const { container } = renderUserMessage(
			"<img src=x onerror=alert(1)>",
			config({ disableHtmlInput: true, disableTextInputSanitization: true }),
		);
		expect(container.querySelector("img")).toBeNull();
	});

	// Entity-like text displays exactly as typed: nothing is decoded. This
	// includes the four sequences an HTML serializer emits. (User text stored by
	// Webchat 3.48–3.53 was escaped before sending, so it displays escaped too.)
	test.each([
		"Tom &amp; Jerry",
		"&lt;3",
		"a &gt; b",
		"a&nbsp;b",
		"&lt;img src=x onerror=alert(1)&gt;",
	])("displays typed %s exactly as typed", text => {
		const { container } = renderUserMessage(text);
		expect(bubbleText(container)).toBe(text);
		expect(container.querySelector("img")).toBeNull();
	});

	// Webchat now sends entities as typed (it no longer decodes them), so the
	// bubble must show them as typed too, and must not decode legacy entity
	// names such as "&reg" inside a query string.
	test.each(["&#60;img src=x onerror=alert(1)&#62;", "?a=1&region=eu&section=2"])(
		"displays typed entity-like text %s unchanged",
		text => {
			const { container } = renderUserMessage(text);
			expect(bubbleText(container)).toBe(text);
			expect(container.querySelector("img")).toBeNull();
		},
	);

	// URLs are linked before escaping. A query string with `&` must still
	// produce a working href.
	test("links URLs that contain &", () => {
		renderUserMessage("see https://example.com/?a=1&region=eu&b=2");
		const link = screen.getByRole("link");
		expect(link.getAttribute("href")?.trim()).toBe("https://example.com/?a=1&region=eu&b=2");
		expect(link.textContent?.trim()).toBe("https://example.com/?a=1&region=eu&b=2");
	});

	// Escaping first would let the URL pattern swallow "&gt;" / "&lt;" and
	// leave a stray ";" in the bubble.
	test.each([
		["see https://example.com> now", "https://example.com"],
		["see https://example.com<b> now", "https://example.com"],
	])("stops the link at < or > in %s", (text, href) => {
		const { container } = renderUserMessage(text);
		expect(screen.getByRole("link").getAttribute("href")?.trim()).toBe(href);
		expect(bubbleText(container)).toBe(text);
	});

	test("does not link URLs when disableRenderURLsAsLinks is set", () => {
		const { container } = renderUserMessage(
			"see https://example.com/?a=1&b=2",
			config({ disableHtmlInput: true, disableRenderURLsAsLinks: true }),
		);
		expect(screen.queryByRole("link")).toBeNull();
		expect(bubbleText(container)).toBe("see https://example.com/?a=1&b=2");
	});

	// The text of a user file upload is rendered by the same Text component.
	test("escapes the text of a user message with attachments", () => {
		const { container } = render(
			<Message
				message={
					{
						...file,
						text: "<img src=x onerror=alert(1)> & co",
						source: "user",
					} as unknown as IMessage
				}
				config={plainTextMode}
			/>,
		);
		expect(container.querySelector('img[src="x"]')).toBeNull();
		expect(container.textContent).toContain("<img src=x onerror=alert(1)> & co");
	});
});

describe("rendering that plain text mode must not change", () => {
	// HTML mode (disableHtmlInput off): user HTML is kept, after sanitizing.
	test("user HTML still renders when disableHtmlInput is off", () => {
		const { container } = renderUserMessage("<b>bold</b>", config({ disableHtmlInput: false }));
		expect(container.querySelector("b")?.textContent).toBe("bold");
	});

	// Consumers that do not pass the setting (for example Interaction Panel)
	// keep the existing behavior.
	test("user HTML still renders when the setting is absent", () => {
		const { container } = renderUserMessage("<b>bold</b>", config({}));
		expect(container.querySelector("b")?.textContent).toBe("bold");
	});

	// The setting is about user input only. Bot output is HTML by design.
	test("bot HTML still renders with disableHtmlInput", () => {
		const { container } = render(
			<Message message={{ text: "<b>bold</b>", source: "bot" }} config={plainTextMode} />,
		);
		expect(container.querySelector("b")?.textContent).toBe("bold");
	});
});

describe("escapeHtml", () => {
	test("escapes &, < and >", () => {
		expect(escapeHtml("a < b & c > d")).toBe("a &lt; b &amp; c &gt; d");
	});

	test("leaves text without special characters unchanged", () => {
		expect(escapeHtml("Tools and Access")).toBe("Tools and Access");
	});
});

describe("plainTextToHtml", () => {
	test("escapes every &, including entity-like sequences", () => {
		expect(plainTextToHtml("a &lt; b & c", false)).toBe("a &amp;lt; b &amp; c");
	});

	test("escapes text around and inside links", () => {
		expect(plainTextToHtml("x < y https://a.com/?q=1&r=2", true)).toBe(
			'x &lt; y<a href=" https://a.com/?q=1&amp;r=2" target="_blank"> https://a.com/?q=1&amp;r=2</a>',
		);
	});
});
