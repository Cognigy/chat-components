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
			["https://example.com/auth?token=123e45$7-e89b-12d3-a456-426614174000"],
			["https://example.com?token=123e4567-e89b-12d3-a456-426614174000"],
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
			"https://user:müller@example.com?token=1838-389484",
			"https://www.muller.müler.de/mü$ler",
			"https://www.muller.mü@ler.de/mü$ler",
			"https://www.Düsseldorf.gov.de?lang=Düsseldorf",
		])("renders %s with combination of unicode characters in single tag", testString => {
			render(<Message message={{ text: testString }} />);
			const textElement = screen.getByText(testString);
			expect(textElement).toBeInTheDocument();
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
