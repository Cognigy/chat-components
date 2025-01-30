import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { Message } from "src/index";

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
});
