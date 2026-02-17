import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { Message } from "src/index";
import { IWebchatConfig } from "src/messages/types";

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

			// The content should be joined and each chunk should have leading spaces trimmed
			const paragraph = container.querySelector("p");
			expect(paragraph?.textContent).toBe("First chunkSecond chunkThird chunk");
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

		test("does NOT trim leading spaces when collateStreamedOutputs is undefined (default)", () => {
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

			// Should preserve the leading spaces when collateStreamedOutputs is not set
			const element = container.querySelector("p");
			expect(element?.innerHTML).toContain("   Default behavior with spaces");
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
});
