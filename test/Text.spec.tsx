import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, test, expect, vi } from "vitest";
import { Message, defaultAllowedHtmlTags } from "src/index";
import { IStreamingMessage, IWebchatConfig } from "src/messages/types";
import StreamingTextAnimation from "src/messages/Text/StreamingTextAnimation";

describe("Text Component", () => {
	describe("Links", () => {
		test("renders all the links in the single paragra of text by breaking them", async () => {
			render(
				<Message
					message={{
						text: "This is the text I used for testing: You can visit https://example.com for general information or explore http://www.example.com for detailed guides. For API documentation, check https://subdomain.example.com/path/to/page. Developers often use http://localhost:3000 or https://127.0.0.1 for local testing. Resources like ftp://example.com/resource/file.txt are helpful, and UK visitors can use https://example.co.uk. For specific queries, try https://example.com?query=param&other=value, or jump directly to sections like https://example.com/path?query=param#fragment. To access restricted content, log in with https://user:passw$ord@example.com. For German users, domains such as https://müller.de or https://frühstück.com are also valid, and international users might visit https://täst.com.",
					}}
				/>,
			);
			const linkElem = screen.getAllByRole("link");
			expect(linkElem.length).toBe(12);
		});
		test.each([
			"https://de.wikipedia.org/wiki/Düsseldorf",
			"https://de.wikipedia.org/wiki/Überlingen",
			"https://de.wikipedia.org/wiki/Äpfel",
			"https://de.wikipedia.org/wiki/Österreich",
		])("renders %s with special characters in single tag", testString => {
			render(<Message message={{ text: testString }} />);
			const textElement = screen.getByText(testString);
			expect(textElement).toBeInTheDocument();
		});

		test.each([
			["https://example.com/search?q=Düsseldorf"],
			["https://example.com/search?q=Überlingen"],
			["https://example.com/search?q=Äpfel"],
			["https://example.com/Düsseldorf?q=Österreich&lang=de"],
			["https://example.com/auth?testParam=123e45$7-e89b-12d3-a456-426614174000"],
			["https://example.com?testParam=123e4567-e89b-12d3-a456-426614174000"],
		])("renders %s with query parameters in single tag", testString => {
			render(<Message message={{ text: testString }} />);
			const textElement = screen.getByText(testString);
			expect(textElement).toBeInTheDocument();
		});

		test.each(["https://example.com/path#section1", "https://example.com/path#Düsseldorf"])(
			"renders %s with deeplinks in single tag",
			testString => {
				render(<Message message={{ text: testString }} />);
				const textElement = screen.getByText(testString);
				expect(textElement).toBeInTheDocument();
			},
		);

		test.each([
			"https://www.muller.müler.de/müller",
			"https://-isers.de",
			"http://-isers.de",
			"https://müller.com",
			"http://localhost:8000",
			"https://user:passw$ord@example.com/müller",
			"https://user:müller@example.com?testParam=1838-389484",
			"https://www.muller.müler.de/mü$ler",
			"https://www.muller.mü@ler.de/mü$ler",
			"https://www.Düsseldorf.gov.de?lang=Düsseldorf",
		])("renders %s with combination of unicode characters in single tag", testString => {
			render(<Message message={{ text: testString }} />);
			const textElement = screen.getByText(testString);
			expect(textElement).toBeInTheDocument();
		});
	});

	describe("Leading Space Trimming", () => {
		test("trims leading spaces for bot source with string content when collateStreamedOutputs is false", () => {
			render(
				<Message
					message={{
						text: "   Hello, this has leading spaces",
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									collateStreamedOutputs: false,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			const textElement = screen.getByText("Hello, this has leading spaces");
			expect(textElement).toBeInTheDocument();
		});

		test("trims leading spaces for engagement source with string content when collateStreamedOutputs is false", () => {
			render(
				<Message
					message={{
						text: "  Engagement message with spaces",
						source: "engagement",
					}}
					config={
						{
							settings: {
								behavior: {
									collateStreamedOutputs: false,
								},
								teaserMessage: {
									showInChat: true,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// Check if text is rendered - engagement messages should be treated like bot messages
			const textElement = screen.getByText("Engagement message with spaces");
			expect(textElement).toBeInTheDocument();
		});

		test("trims leading spaces for bot source with array content when collateStreamedOutputs is false", () => {
			const { container } = render(
				<Message
					message={{
						text: "  First chunk   Second chunk Third chunk",
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									collateStreamedOutputs: false,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// The content should have leading spaces trimmed (but spaces between words are preserved)
			const paragraph = container.querySelector("p");
			expect(paragraph?.textContent).toBe("First chunk   Second chunk Third chunk");
		});

		test("does NOT trim leading spaces when collateStreamedOutputs is true", () => {
			const { container } = render(
				<Message
					message={{
						text: "   Hello with spaces",
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									collateStreamedOutputs: true,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// Should preserve the leading spaces
			const element = container.querySelector("p");
			expect(element?.innerHTML).toContain("   Hello with spaces");
		});

		test("does NOT trim leading spaces for user source", () => {
			const { container } = render(
				<Message
					message={{
						text: "   User message with spaces",
						source: "user",
					}}
					config={
						{
							settings: {
								behavior: {
									collateStreamedOutputs: false,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// Should preserve the leading spaces for user messages
			const element = container.querySelector("p");
			expect(element?.innerHTML).toContain("   User message with spaces");
		});

		test("preserves spacing between words and chunks when trimming", () => {
			const { container } = render(
				<Message
					message={{
						text: "  Hello world from chunks",
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									collateStreamedOutputs: false,
								},
							},
						} as IWebchatConfig
					}
					disableHeader={true}
				/>,
			);

			// Spacing between words should be preserved (only the leading spaces are trimmed from each chunk)
			const paragraph = container.querySelector("p");
			expect(paragraph?.textContent).toBe("Hello world from chunks");
		});

		test("trims leading spaces when collateStreamedOutputs is undefined (default)", () => {
			const { container } = render(
				<Message
					message={{
						text: "   Default behavior with spaces",
						source: "bot",
					}}
					config={
						{
							settings: {},
						} as IWebchatConfig
					}
				/>,
			);

			// Should trim the leading spaces when collateStreamedOutputs is not set (undefined is falsy)
			const element = container.querySelector("p");
			expect(element?.innerHTML).toContain("Default behavior with spaces");
			expect(element?.innerHTML).not.toContain("   Default behavior with spaces");
		});
	});

	describe("Markdown Rendering", () => {
		test("preserves checkbox input elements when renderMarkdown is true", () => {
			const markdownText =
				"### Did you like our service? \n <ul><li><input type='checkbox'/> Yes</li><li><input type='checkbox'/> No</li></ul>";

			const { container } = render(
				<Message
					message={{
						text: markdownText,
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									renderMarkdown: true,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// Verify that checkbox input elements are present in the rendered output
			const checkboxes = container.querySelectorAll("input[type='checkbox']");
			expect(checkboxes.length).toBe(2);
		});

		test("preserves text input elements when renderMarkdown is true", () => {
			const markdownText =
				"### Feedback Form \n <input type='text' placeholder='Enter your feedback' />";

			const { container } = render(
				<Message
					message={{
						text: markdownText,
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									renderMarkdown: true,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// Verify that text input element is present in the rendered output
			const textInputs = container.querySelectorAll("input[type='text']");
			expect(textInputs.length).toBe(1);
			expect(textInputs[0]).toHaveAttribute("placeholder", "Enter your feedback");
		});

		test("preserves multiple input types in markdown when renderMarkdown is true", () => {
			const markdownText =
				"### Did you like our service? \n <ul><li><input type='checkbox'/> Yes</li><li><input type='checkbox'/> No</li></ul> <input type='text' placeholder='Enter a short feedback' aria-label='Additional feedback'/>";

			const { container } = render(
				<Message
					message={{
						text: markdownText,
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									renderMarkdown: true,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// Verify that both checkbox and text input elements are present
			const checkboxes = container.querySelectorAll("input[type='checkbox']");
			const textInputs = container.querySelectorAll("input[type='text']");

			expect(checkboxes.length).toBe(2);
			expect(textInputs.length).toBe(1);
			expect(textInputs[0]).toHaveAttribute("placeholder", "Enter a short feedback");
			expect(textInputs[0]).toHaveAttribute("aria-label", "Additional feedback");
		});

		test("renders markdown heading correctly when renderMarkdown is true", () => {
			const markdownText = "### Test Heading";

			const { container } = render(
				<Message
					message={{
						text: markdownText,
						source: "bot",
					}}
					config={
						{
							settings: {
								behavior: {
									renderMarkdown: true,
								},
							},
						} as IWebchatConfig
					}
				/>,
			);

			// Verify that markdown heading is rendered as h3 element
			const heading = container.querySelector("h3");
			expect(heading).toBeInTheDocument();
			expect(heading?.textContent).toBe("Test Heading");
		});
	});

	describe("Progressive Markdown Rendering", () => {
		afterEach(() => vi.useRealTimers());

		const renderStreamingText = (
			text: string | string[],
			renderMarkdown = true,
			onSetMessageAnimated?: (id: string, state: IStreamingMessage["animationState"]) => void,
			onSetLiveRegionText?: (id: string, text: string) => void,
			finished = true,
		) => {
			const config = {
				settings: {
					behavior: { progressiveMessageRendering: true, renderMarkdown },
				},
			} as IWebchatConfig;
			const renderMessage = (
				messageText: string | string[],
				animationState: IStreamingMessage["animationState"] = "start",
				isFinished = finished,
			) => (
				<Message
					message={
						{
							id: "streaming-text",
							source: "bot",
							// Streaming chunks are supported at runtime, though socket-client
							// currently types message.text as a single string.
							text: messageText,
							animationState,
							finishReason: isFinished ? "stop" : undefined,
						} as unknown as IStreamingMessage
					}
					config={config}
					onSetMessageAnimated={onSetMessageAnimated}
					onSetLiveRegionText={onSetLiveRegionText}
					data-message-id="streaming-text"
				/>
			);
			const result = render(renderMessage(text));
			return {
				...result,
				renderText: (
					nextText: string | string[],
					animationState?: IStreamingMessage["animationState"],
					isFinished?: boolean,
				) => result.rerender(renderMessage(nextText, animationState, isFinished)),
			};
		};

		const advanceCharacters = async (count: number) => {
			for (let index = 0; index < count; index++) {
				await act(async () => {
					await vi.advanceTimersByTimeAsync(25);
				});
			}
		};

		test.each([
			["Here is **bold text**", /\*\*/u],
			["Read [the guide](https://example.com/guide)", /\[|\]|\]\(|https?:\/\//u],
			["This is <b>bold</b> and `code`", /<\/?b|`/u],
			["### Heading\n- list item", /###|^- /u],
		])("does not expose raw syntax in any sampled frame of %s", async (text, rawSyntax) => {
			vi.useFakeTimers();
			const { container } = renderStreamingText(text);

			for (let index = 0; index < text.length + 3; index++) {
				await advanceCharacters(1);
				const visible = container.querySelector(".markdown")?.textContent ?? "";
				expect(visible, `visible text after ${index + 1} timer ticks`).not.toMatch(
					rawSyntax,
				);
			}
		});

		test("renders incomplete bold markup during typing and completes without duplicating text", async () => {
			vi.useFakeTimers();
			const onSetMessageAnimated = vi.fn();
			const onSetLiveRegionText = vi.fn();
			const { container, renderText } = renderStreamingText(
				"**bold text**",
				true,
				onSetMessageAnimated,
				onSetLiveRegionText,
			);

			await advanceCharacters(1);
			expect(container.querySelector(".markdown")?.textContent).toBe("");
			await advanceCharacters(1);
			expect(container.querySelector(".markdown")?.textContent).toBe("");
			await advanceCharacters(6);
			expect(container.querySelector("strong")?.textContent).toMatch(/^bold/);
			expect(container.textContent).not.toContain("**");
			expect(onSetMessageAnimated).not.toHaveBeenCalledWith("streaming-text", "done");
			expect(onSetLiveRegionText).not.toHaveBeenCalled();

			await advanceCharacters(25);
			expect(container.querySelector("strong")?.textContent).toBe("bold text");
			expect(container.querySelectorAll("strong")).toHaveLength(1);
			expect(onSetMessageAnimated).toHaveBeenCalledWith("streaming-text", "done");

			renderText("**bold text**", "done");
			expect(container.querySelector("strong")?.textContent).toBe("bold text");
			expect(container.querySelectorAll("strong")).toHaveLength(1);
		});

		test("keeps formatting continuous across streamed chunks", async () => {
			vi.useFakeTimers();
			const onSetMessageAnimated = vi.fn();
			const { container } = renderStreamingText(
				["Hello **bold", " and more**"],
				true,
				onSetMessageAnimated,
			);

			await advanceCharacters(15);
			expect(container.querySelector("strong")?.textContent).toMatch(/^bold/);
			expect(container.textContent).not.toContain("**");
			expect(onSetMessageAnimated).not.toHaveBeenCalledWith("streaming-text", "done");

			await advanceCharacters(53);
			expect(container.querySelector("strong")?.textContent).toBe("bold and more");
			expect(container.querySelectorAll("strong")).toHaveLength(1);
			expect(onSetMessageAnimated).toHaveBeenCalledWith("streaming-text", "done");
		});

		test.each(["new array", "same array"])(
			"renders a chunk appended with a %s while the previous chunk is still typing",
			async arrayUpdate => {
				vi.useFakeTimers();
				const onSetMessageAnimated = vi.fn();
				const chunks = ["Hello **bold"];
				const { container, renderText } = renderStreamingText(
					chunks,
					true,
					onSetMessageAnimated,
				);

				await advanceCharacters(6);
				if (arrayUpdate === "same array") {
					chunks.push(" and more**");
					renderText(chunks);
				} else {
					renderText([...chunks, " and more**"]);
				}

				await advanceCharacters(65);
				expect(container.querySelector("strong")?.textContent).toBe("bold and more");
				expect(onSetMessageAnimated).toHaveBeenCalledWith("streaming-text", "done");
			},
		);

		test("hides incomplete link syntax and exposes the final link only when complete", async () => {
			vi.useFakeTimers();
			const { container } = renderStreamingText("[helpful link](https://example.com)");

			await advanceCharacters(1);
			expect(container.querySelector(".markdown")?.textContent).toBe("");
			await advanceCharacters(13);
			expect(container.querySelector(".markdown")?.textContent).toMatch(/^helpful lin/);
			expect(container.querySelector("a")).toBeNull();

			await advanceCharacters(1);
			expect(container.textContent).toContain("helpful link");
			expect(container.textContent).not.toContain("[");
			expect(container.querySelector("a")).toBeNull();

			await advanceCharacters(54);
			expect(screen.getByRole("link", { name: "helpful link" })).toHaveAttribute(
				"href",
				"https://example.com",
			);
			expect(container.textContent).not.toContain("](");
		});

		test("handles delayed link chunks and waits for the last chunk before finishing", async () => {
			vi.useFakeTimers();
			const onSetMessageAnimated = vi.fn();
			const chunks = [
				"Read the [Markdown",
				" guide](",
				"https://example.com/guide",
				") done",
			];
			const { container, renderText } = renderStreamingText(
				chunks.slice(0, 1),
				true,
				onSetMessageAnimated,
				undefined,
				false,
			);

			await advanceCharacters(45);
			expect(container.querySelector(".markdown")?.textContent).toBe("Read the Markdown");
			expect(onSetMessageAnimated).not.toHaveBeenCalledWith("streaming-text", "done");

			renderText(chunks.slice(0, 2), "start", false);
			await advanceCharacters(35);
			expect(container.querySelector(".markdown")?.textContent).toBe(
				"Read the Markdown guide",
			);
			expect(container.querySelector("a")).toBeNull();

			renderText(chunks.slice(0, 3), "start", false);
			await advanceCharacters(85);
			expect(container.querySelector(".markdown")?.textContent).toBe(
				"Read the Markdown guide",
			);
			expect(onSetMessageAnimated).not.toHaveBeenCalledWith("streaming-text", "done");

			renderText(chunks, "start", true);
			await advanceCharacters(45);
			expect(screen.getByRole("link", { name: "Markdown guide" })).toHaveAttribute(
				"href",
				"https://example.com/guide",
			);
			expect(container.querySelector(".markdown")?.textContent).toBe(
				"Read the Markdown guide done",
			);
			expect(onSetMessageAnimated).toHaveBeenCalledWith("streaming-text", "done");
		});

		test.each([
			{ renderMarkdown: true, label: "Markdown" },
			{ renderMarkdown: false, label: "plain-text" },
		])(
			"completes a $label message when finishReason arrives after its last chunk",
			async ({ renderMarkdown }) => {
				vi.useFakeTimers();
				const onSetMessageAnimated = vi.fn();
				const chunks = ["Here is **bold", " text**"];
				const { container, renderText } = renderStreamingText(
					chunks,
					renderMarkdown,
					onSetMessageAnimated,
					undefined,
					false,
				);

				await advanceCharacters(60);
				if (renderMarkdown) {
					expect(container.querySelector("strong")?.textContent).toBe("bold text");
				} else {
					expect(container.textContent).toContain("Here is **bold text**");
				}
				expect(onSetMessageAnimated).not.toHaveBeenCalledWith("streaming-text", "done");

				renderText(chunks, "start", true);
				await advanceCharacters(2);
				expect(onSetMessageAnimated).toHaveBeenCalledWith("streaming-text", "done");
				expect(
					onSetMessageAnimated.mock.calls.filter(([, state]) => state === "done"),
				).toHaveLength(1);

				renderText(chunks, "done", true);
				expect(
					onSetMessageAnimated.mock.calls.filter(([, state]) => state === "done"),
				).toHaveLength(1);
			},
		);

		test("renders partial inline code and raw HTML without exposing incomplete tags", async () => {
			vi.useFakeTimers();
			const { container } = renderStreamingText("`code` <b>bold</b>");

			await advanceCharacters(1);
			expect(container.querySelector(".markdown")?.textContent).toBe("");
			await advanceCharacters(3);
			expect(container.querySelector("code")?.textContent).toMatch(/^c/);
			expect(container.textContent).not.toContain("`");

			await advanceCharacters(3);
			expect(container.querySelector(".markdown")?.textContent).toBe("code");
			await advanceCharacters(6);
			expect(container.querySelector("b")?.textContent).toMatch(/^bo/);
			expect(container.textContent).not.toContain("<b");
		});

		test.each([
			{ text: "# Heading", markerLength: 1, selector: "h1" },
			{ text: "- item", markerLength: 1, selector: "li" },
			{ text: "1. item", markerLength: 2, selector: "li" },
		])(
			"hides an unfinished block marker in $text",
			async ({ text, markerLength, selector }) => {
				vi.useFakeTimers();
				const { container } = renderStreamingText(text);

				await advanceCharacters(markerLength);
				expect(container.querySelector(".markdown")?.textContent).toBe("");

				await advanceCharacters(20);
				expect(container.querySelector(selector)?.textContent).toBe(text.split(" ").at(-1));
			},
		);

		test("shows literal punctuation and brackets once animation finishes", async () => {
			vi.useFakeTimers();
			const { container, renderText } = renderStreamingText(
				"A * and [label]",
				true,
				undefined,
				undefined,
				false,
			);

			await advanceCharacters(3);
			expect(container.querySelector(".markdown")?.textContent).toBe("A");

			await advanceCharacters(30);
			expect(container.querySelector(".markdown")?.textContent).toBe("A * and label");

			renderText("A * and [label]", "start", true);
			expect(container.querySelector(".markdown")?.textContent).toBe("A * and [label]");
		});

		test.each([
			["without a completion callback", undefined],
			["when the callback does not update animationState", vi.fn()],
		])("restores literal final Markdown %s", async (_label, onSetMessageAnimated) => {
			vi.useFakeTimers();
			const chunks = ["A * and ", "[label]"];
			const { container, renderText } = renderStreamingText(
				chunks,
				true,
				onSetMessageAnimated,
				undefined,
				false,
			);
			await advanceCharacters(45);
			expect(container.querySelector(".markdown")?.textContent).toBe("A * and label");

			renderText(chunks, "start", true);
			expect(container.querySelector(".markdown")?.textContent).toBe("A * and [label]");
		});

		test("batches partial Markdown previews and clears pending updates on completion", async () => {
			vi.useFakeTimers();
			const onTypingTextUpdate = vi.fn();
			const onTextUpdate = vi.fn();
			const text = "a".repeat(64);
			const { unmount } = render(
				<StreamingTextAnimation
					content={[text]}
					messageId="batched-preview"
					animationState="start"
					finishReason={undefined}
					renderTypingText={false}
					onTextUpdate={onTextUpdate}
					onTypingTextUpdate={onTypingTextUpdate}
				/>,
			);

			await advanceCharacters(10);
			expect(onTypingTextUpdate.mock.calls.length).toBeLessThan(8);
			expect(onTypingTextUpdate.mock.lastCall?.[0].length).toBeGreaterThan(5);

			await advanceCharacters(60);
			expect(onTextUpdate).toHaveBeenCalledWith(text);
			expect(onTypingTextUpdate.mock.lastCall).toEqual([""]);
			const updatesAfterCompletion = onTypingTextUpdate.mock.calls.length;
			await advanceCharacters(10);
			expect(onTypingTextUpdate).toHaveBeenCalledTimes(updatesAfterCompletion);
			unmount();
		});

		test("does not expose a partial escaped delimiter", async () => {
			vi.useFakeTimers();
			const { container, renderText } = renderStreamingText("escaped \\*asterisk\\*");

			await advanceCharacters(9);
			expect(container.querySelector(".markdown")?.textContent).toBe("escaped");
			await advanceCharacters(10);
			expect(container.querySelector(".markdown")?.textContent).toBe("escaped *asterisk");
			expect(container.querySelector(".markdown")?.textContent).not.toContain("\\");

			await advanceCharacters(20);
			renderText("escaped \\*asterisk\\*", "done");
			expect(container.querySelector(".markdown")?.textContent).toBe("escaped *asterisk*");
		});

		test("keeps the existing plain-text typing behavior when Markdown is disabled", async () => {
			vi.useFakeTimers();
			const { container } = renderStreamingText("**bold**", false);

			await advanceCharacters(4);
			expect(container.querySelector("strong")).toBeNull();
			expect(container.querySelector("p")?.textContent).toBe("");
			expect(container.textContent).toContain("**bo");
		});
	});

	describe("Consumers that drop the <style> tag", () => {
		// An embedding page with a nonce-only style-src-elem (the Cognigy.AI
		// Interaction Panel) drops `style` from the allowlist so no message
		// <style> reaches its DOM. Inline style attributes must keep working.
		const styledText =
			'Hello <style>.x { color: red; }</style><span style="color: rgb(1, 2, 3)">styled</span>';

		const renderText = (config?: IWebchatConfig, renderMarkdown = false) =>
			render(
				<Message
					message={{ text: styledText, source: "bot" }}
					config={
						{
							...config,
							settings: {
								...config?.settings,
								behavior: { renderMarkdown },
							},
						} as IWebchatConfig
					}
				/>,
			);

		const withoutStyleTag = {
			settings: {
				widgetSettings: {
					customAllowedHtmlTags: defaultAllowedHtmlTags.filter(tag => tag !== "style"),
				},
			},
		} as IWebchatConfig;

		test("exports the default allowlist frozen, including style", () => {
			expect(Object.isFrozen(defaultAllowedHtmlTags)).toBe(true);
			expect(defaultAllowedHtmlTags).toContain("style");
			expect(defaultAllowedHtmlTags).toContain("span");
		});

		test("keeps <style> by default, so the deployed webchat is unchanged", () => {
			const { container } = renderText();
			expect(container.querySelector("style")).not.toBeNull();
			expect(container.querySelector("span[style]")).not.toBeNull();
		});

		test.each([
			["HTML", false],
			["markdown", true],
		])(
			"strips <style> but keeps inline style attributes when rendering %s",
			(_, renderMarkdown) => {
				const { container } = renderText(withoutStyleTag, renderMarkdown);
				expect(container.querySelector("style")).toBeNull();
				expect(container.textContent).not.toContain("color: red");
				expect(screen.getByText("styled").style.color).toBe("rgb(1, 2, 3)");
				expect(container.textContent).toContain("Hello");
			},
		);
	});
});
