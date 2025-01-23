import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { Message } from "src/index";

describe("Text Component", () => {
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
		["https://example.com/auth?token=123e4567-e89b-12d3-a456-426614174000"],
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
});
