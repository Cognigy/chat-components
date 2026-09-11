import { describe, it, expect } from "vitest";
// src/utils → matcher → message components → Message.tsx → src/utils is a
// module cycle; Message.tsx instantiates a utils class at module top, so the
// graph must be entered via Message (as every component spec does) rather
// than via utils directly.
import "src/messages/Message";
import { htmlToPlainText } from "src/utils";

// Plain-text projection of sanitized HTML for ARIA attribute values
// (gallery default_action link names, CGY-37634).
describe("htmlToPlainText", () => {
	it("returns plain strings unchanged", () => {
		expect(htmlToPlainText("Card with link")).toBe("Card with link");
	});

	it("strips tags and decodes entities", () => {
		expect(htmlToPlainText("<b>Sale</b> &amp; <i>more</i>")).toBe("Sale & more");
	});

	it("trims surrounding whitespace so whitespace-only markup counts as empty", () => {
		expect(htmlToPlainText("<b> </b>")).toBe("");
		expect(htmlToPlainText("  x  ")).toBe("x");
	});

	it("is empty for empty or missing input", () => {
		expect(htmlToPlainText("")).toBe("");
		expect(htmlToPlainText(undefined)).toBe("");
	});

	it("does not execute scripts or load resources while extracting text", () => {
		// DOMParser documents are inert: no script runs, no image loads.
		expect(htmlToPlainText('<img src="x" onerror="globalThis.__pwned = true">text')).toBe(
			"text",
		);
		expect((globalThis as { __pwned?: boolean }).__pwned).toBeUndefined();
	});
});
