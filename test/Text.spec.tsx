import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { Message } from "src/index";

describe("Text Component", () => {
	test("renders the correct text with special characters", () => {
		const testString = "https://de.wikipedia.org/wiki/Düsseldorf";
		render(<Message message={{ text: testString }} />);

		const textElement = screen.getByText(/https:\/\/de\.wikipedia\.org\/wiki\/Düsseldorf/i);
		expect(textElement).toBeInTheDocument();

		const testString2 = "https://de.wikipedia.org/wiki/Überlingen";
		render(<Message message={{ text: testString2 }} />);
		const textElement2 = screen.getByText(/https:\/\/de\.wikipedia\.org\/wiki\/Überlingen/i);
		expect(textElement2).toBeInTheDocument();

		const testString3 = "https://de.wikipedia.org/wiki/Äpfel";
		render(<Message message={{ text: testString3 }} />);
		const textElement3 = screen.getByText(/https:\/\/de\.wikipedia\.org\/wiki\/Äpfel/i);
		expect(textElement3).toBeInTheDocument();

		const testString4 = "https://de.wikipedia.org/wiki/Österreich";
		render(<Message message={{ text: testString4 }} />);
		const textElement4 = screen.getByText(/https:\/\/de\.wikipedia\.org\/wiki\/Österreich/i);
		expect(textElement4).toBeInTheDocument();
	});
});
