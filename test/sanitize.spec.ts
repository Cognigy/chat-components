import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the problematic imports before importing sanitize
vi.mock("src/messages/hooks", () => ({
	useMessageContext: vi.fn(() => ({
		config: {},
	})),
}));

import { sanitizeHTMLWithConfig } from "../src/sanitize";

describe("sanitizeHTMLWithConfig", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Basic Sanitization", () => {
		test("returns empty string for empty input", () => {
			const result = sanitizeHTMLWithConfig("", undefined);
			expect(result).toBe("");
		});

		test("preserves allowed HTML tags", () => {
			const input = "<b>bold</b> and <i>italic</i>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toContain("<b>bold</b>");
			expect(result).toContain("<i>italic</i>");
		});

		test("removes script tags", () => {
			const input = "<script>alert('xss')</script>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<script>");
			expect(result).not.toContain("alert");
		});

		test("removes onclick attributes", () => {
			const input = '<div onclick="alert(1)">click me</div>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("onclick");
		});
	});

	describe("Iterative Sanitization (Bypass Prevention)", () => {
		test("handles nested angle bracket bypass attempt: <<b>i>", () => {
			const input = "<<b>i> test <</b>/i>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			// After iterative sanitization, the result should be stable
			// and not contain any unescaped malicious tags
			const secondPass = sanitizeHTMLWithConfig(result, undefined);
			expect(result).toBe(secondPass);
		});

		test("sanitization result is stable (idempotent)", () => {
			const testCases = [
				"<<b>i> test <</b>/i>",
				"<<<script>script>alert(1)<</script>/script>",
				"<div<script>>alert(1)</script</div>>",
				"<<img>img src=x onerror=alert(1)>",
				"<a<<b>href>javascript:alert(1)</a>",
			];

			for (const input of testCases) {
				const firstPass = sanitizeHTMLWithConfig(input, undefined);
				const secondPass = sanitizeHTMLWithConfig(firstPass, undefined);
				expect(firstPass).toBe(secondPass);
			}
		});

		test("does not produce valid HTML tags from obfuscated input", () => {
			const input = "<<script>script>alert('xss')<</script>/script>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toMatch(/<script[^>]*>/i);
		});

		test("handles deeply nested bypass attempts", () => {
			// Multiple layers of obfuscation
			const input = "<<<b>b>b>test</</b>/b>/b>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			const secondPass = sanitizeHTMLWithConfig(result, undefined);
			expect(result).toBe(secondPass);
		});
	});

	describe("Edge Cases", () => {
		test("handles input starting with closing tag", () => {
			const input = "</div>some text";
			const result = sanitizeHTMLWithConfig(input, undefined);
			// Should escape the angle brackets
			expect(result).toContain("&lt;");
			expect(result).toContain("&gt;");
		});

		test("handles multiple closing tags at start", () => {
			const input = "</span></div>content";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toContain("&lt;");
		});

		test("preserves plain text", () => {
			const input = "Hello, this is plain text without any HTML";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toBe(input);
		});

		test("handles mixed valid and invalid content", () => {
			const input = "<b>valid</b><script>invalid</script><i>also valid</i>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toContain("<b>valid</b>");
			expect(result).toContain("<i>also valid</i>");
			expect(result).not.toContain("<script>");
		});
	});

	describe("Custom Allowed Tags", () => {
		test("respects custom allowed tags", () => {
			const input = "<div>div content</div><span>span content</span>";
			const customTags = ["div"];
			const result = sanitizeHTMLWithConfig(input, customTags);
			expect(result).toContain("<div>");
			expect(result).not.toContain("<span>");
		});

		test("custom tags also benefit from iterative sanitization", () => {
			const input = "<<div>div>test<</div>/div>";
			const customTags = ["div"];
			const result = sanitizeHTMLWithConfig(input, customTags);
			const secondPass = sanitizeHTMLWithConfig(result, customTags);
			expect(result).toBe(secondPass);
		});
	});

	describe("SSML Content Handling", () => {
		test("strips SSML <speak> root element but preserves content", () => {
			const input = "<speak>Hello, how are you today?</speak>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<speak>");
			expect(result).not.toContain("</speak>");
			expect(result).toContain("Hello, how are you today?");
		});

		test("strips SSML <voice> tags but preserves content", () => {
			const input = '<voice name="en-US-Wavenet-D">Welcome to the service.</voice>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<voice");
			expect(result).not.toContain("</voice>");
			expect(result).toContain("Welcome to the service.");
		});

		test("strips SSML <prosody> tags but preserves content", () => {
			const input = '<prosody rate="slow" pitch="low">Speaking slowly now.</prosody>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<prosody");
			expect(result).not.toContain("</prosody>");
			expect(result).toContain("Speaking slowly now.");
		});

		test("strips SSML <emphasis> tags but preserves content", () => {
			const input = '<emphasis level="strong">This is important!</emphasis>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<emphasis");
			expect(result).not.toContain("</emphasis>");
			expect(result).toContain("This is important!");
		});

		test("strips SSML <say-as> tags but preserves content", () => {
			const input = '<say-as interpret-as="date" format="mdy">12-25-2024</say-as>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<say-as");
			expect(result).not.toContain("</say-as>");
			expect(result).toContain("12-25-2024");
		});

		test("strips SSML <phoneme> tags but preserves content", () => {
			const input = '<phoneme alphabet="ipa" ph="təˈmeɪtoʊ">tomato</phoneme>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<phoneme");
			expect(result).not.toContain("</phoneme>");
			expect(result).toContain("tomato");
		});

		test("strips SSML <break> tags", () => {
			const input = 'Hello<break time="500ms"/>world';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<break");
			expect(result).toContain("Hello");
			expect(result).toContain("world");
		});

		test("handles complex nested SSML structure", () => {
			const input = `<speak>
				<voice name="en-US-Wavenet-D">
					Welcome! <prosody rate="slow">Please listen carefully.</prosody>
					<break time="1s"/>
					Your order number is <say-as interpret-as="cardinal">12345</say-as>.
				</voice>
			</speak>`;
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<speak>");
			expect(result).not.toContain("<voice");
			expect(result).not.toContain("<prosody");
			expect(result).not.toContain("<break");
			expect(result).not.toContain("<say-as");
			expect(result).toContain("Welcome!");
			expect(result).toContain("Please listen carefully.");
			expect(result).toContain("12345");
		});

		test("handles SSML mixed with HTML - escapes unknown wrapper tags", () => {
			// When HTML is wrapped in unknown SSML tags like <speak>, the HTMLUnknownElement
			// hook converts the entire content to escaped text for safety
			const input =
				"<speak><b>Bold text</b> and <prosody rate='fast'>fast speech</prosody></speak>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			// The content gets escaped because <speak> is an unknown HTML element
			expect(result).toContain("&lt;speak&gt;");
			expect(result).toContain("Bold text");
			expect(result).toContain("fast speech");
		});

		test("handles HTML with inline SSML tags (no wrapper)", () => {
			// When SSML tags are inline without wrapping valid HTML, they get stripped
			const input = "<b>Bold text</b> and <prosody rate='fast'>fast speech</prosody>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toContain("<b>Bold text</b>");
			expect(result).toContain("fast speech");
			expect(result).not.toContain("<prosody");
		});

		test("preserves HTML <sub> tag (also valid SSML)", () => {
			const input = "H<sub>2</sub>O is water";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toContain("<sub>2</sub>");
		});

		test("preserves HTML <audio> tag (also valid SSML)", () => {
			const input = '<audio src="sound.mp3">Audio fallback</audio>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toContain("<audio");
			expect(result).toContain("Audio fallback");
		});

		test("handles SSML with nested bypass attempts", () => {
			const input = "<<speak>script>alert(1)<</speak>/script>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			const secondPass = sanitizeHTMLWithConfig(result, undefined);
			expect(result).toBe(secondPass);
			expect(result).not.toMatch(/<script[^>]*>/i);
		});

		test("SSML sanitization result is stable (idempotent)", () => {
			const ssmlInputs = [
				"<speak>Hello world</speak>",
				'<voice name="test"><prosody rate="slow">Content</prosody></voice>',
				'<say-as interpret-as="telephone">+1-800-555-1234</say-as>',
				'<phoneme alphabet="x-sampa" ph="h@l\'oU">hello</phoneme>',
			];

			for (const input of ssmlInputs) {
				const firstPass = sanitizeHTMLWithConfig(input, undefined);
				const secondPass = sanitizeHTMLWithConfig(firstPass, undefined);
				expect(firstPass).toBe(secondPass);
			}
		});
	});
});
