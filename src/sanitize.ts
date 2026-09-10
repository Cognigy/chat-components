import DOMPurify, { Config } from "dompurify";
import { useMessageContext } from "src/messages/hooks";
import { useCallback } from "react";

// Tags removed from the previous allow-list to align with DOMPurify's secure defaults
// (WCH-SI10-001 / FedRAMP hardening). Each tag enables a distinct attack vector:
//   applet          — Java applet execution
//   base            — rewrites all relative URLs on the host page
//   body / html / head — structural document elements; no legitimate use in sanitised fragments
//   embed           — loads arbitrary external content / plugins
//   form            — posts user data to attacker-controlled URLs
//   frame / frameset / noframes — clickjacking and legacy frame injection
//   iframe          — inline HTML documents; srcdoc = direct XSS vector
//   link            — loads external stylesheets
//   meta            — HTTP redirects and CSP bypass via http-equiv
//   object          — loads Flash, PDFs, and arbitrary external content
//   style           — CSS injection and attribute-value exfiltration
// These tags are blocked by default when no custom tag list is configured.
// Tenants can supply a replacement list via widgetSettings.customAllowedHtmlTags,
// but tags in ALWAYS_BLOCKED_TAGS are stripped from that list before it is applied.
export const allowedHtmlTags = [
	"a",
	"abbr",
	"acronym",
	"address",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"basefont",
	"bdi",
	"bdo",
	"big",
	"blockquote",
	"br",
	"button",
	"canvas",
	"caption",
	"center",
	"cite",
	"code",
	"col",
	"colgroup",
	"data",
	"datalist",
	"dd",
	"del",
	"details",
	"dfn",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"em",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"header",
	"hr",
	"i",
	"img",
	"input",
	"ins",
	"kbd",
	"label",
	"legend",
	"li",
	"main",
	"map",
	"mark",
	"meter",
	"nav",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"param",
	"picture",
	"pre",
	"progress",
	"q",
	"rp",
	"rt",
	"ruby",
	"s",
	"samp",
	"section",
	"select",
	"small",
	"source",
	"span",
	"strike",
	"strong",
	"sub",
	"summary",
	"sup",
	"svg",
	"table",
	"tbody",
	"td",
	"template",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"title",
	"tr",
	"track",
	"tt",
	"u",
	"ul",
	"var",
	"video",
	"wbr",
];

// Attributes removed from the previous allow-list (WCH-SI10-001 / FedRAMP hardening):
//   action / formaction — form submission to attacker-controlled URLs
//   sandbox             — giving content control over its own sandbox policy
//   srcdoc              — inline HTML document in an iframe (direct XSS vector; iframe itself is now blocked)
//   style               — inline CSS injection and attribute-value exfiltration
//   target              — controls navigation target (_blank without rel is risky)
export const allowedHtmlAttributes = [
	"accept",
	"accept-charset",
	"accesskey",
	"align",
	"alt",
	"autocomplete",
	"autofocus",
	"autoplay",
	"bgcolor",
	"border",
	"charset",
	"checked",
	"cite",
	"class",
	"color",
	"cols",
	"colspan",
	"content",
	"contenteditable",
	"controls",
	"coords",
	"data",
	"data-*",
	"datetime",
	"default",
	"dir",
	"dirname",
	"disabled",
	"download",
	"draggable",
	"dropzone",
	"enctype",
	"for",
	"form",
	"headers",
	"height",
	"hidden",
	"high",
	"href",
	"hreflang",
	"http-equiv",
	"id",
	"ismap",
	"kind",
	"label",
	"lang",
	"list",
	"loop",
	"low",
	"max",
	"maxlength",
	"media",
	"method",
	"min",
	"multiple",
	"muted",
	"name",
	"novalidate",
	"open",
	"optimum",
	"pattern",
	"placeholder",
	"poster",
	"preload",
	"readonly",
	"rel",
	"required",
	"reversed",
	"rows",
	"rowspan",
	"scope",
	"selected",
	"shape",
	"size",
	"sizes",
	"span",
	"spellcheck",
	"src",
	"srclang",
	"srcset",
	"start",
	"step",
	"tabindex",
	"title",
	"translate",
	"type",
	"usemap",
	"value",
	"width",
	"wrap",
];

// Hard deny-list applied to tenant-supplied customAllowedHtmlTags before the list
// is passed to DOMPurify. These tags cannot be re-enabled via tenant configuration.
export const ALWAYS_BLOCKED_TAGS = new Set([
	"script",
	"iframe",
	"object",
	"embed",
	"applet",
	"frame",
	"frameset",
	"meta",
	"base",
	"link",
	"style",
	"form",
]);

const config: Config = {
	ALLOWED_TAGS: allowedHtmlTags,
	ALLOWED_ATTR: allowedHtmlAttributes,
};

export const useSanitize = () => {
	const { config } = useMessageContext();
	const isSanitizeEnabled = !config?.settings?.layout?.disableHtmlContentSanitization;
	const customAllowedHtmlTags = config?.settings?.widgetSettings?.customAllowedHtmlTags;

	const processHTML = useCallback(
		(text: string) => {
			if (!isSanitizeEnabled) return text;
			return sanitizeHTMLWithConfig(text, customAllowedHtmlTags);
		},
		[isSanitizeEnabled, customAllowedHtmlTags],
	);

	return {
		processHTML,
		isSanitizeEnabled,
	};
};

const MAX_SANITIZATION_ITERATIONS = 10;

/**
 * Post-processes sanitized HTML to iteratively and recursively sanitize the
 * content of `srcdoc` attributes. DOMPurify treats `srcdoc` as a plain string
 * attribute and does not sanitize its inner HTML, which allows XSS payloads
 * such as `<iframe srcdoc="<script>alert(1)</script>">` to pass through.
 *
 * This function parses the already-sanitized HTML, finds any elements with a
 * `srcdoc` attribute, and runs iterative `DOMPurify.sanitize()` on each value
 * (matching the same security guarantees as the main sanitization loop). It
 * then recurses into the sanitized srcdoc content to handle deeply nested
 * srcdoc attributes (e.g., `<iframe srcdoc="<iframe srcdoc='...'>">`).
 *
 * It must be called **after** `DOMPurify.removeAllHooks()` so the inner
 * `sanitize()` calls do not interfere with hook-based state. This means srcdoc
 * content is intentionally sanitized **without** the HTMLUnknownElement hook
 * (which handles SSML tags in the main content). Standard DOMPurify
 * sanitization is sufficient for srcdoc since SSML tags are not expected there.
 *
 * **Browser-only**: This function requires `document` to be available. In
 * non-browser environments (e.g., SSR) it returns the input unchanged (the
 * HTML has already been sanitized by DOMPurify before this post-processing).
 *
 * Note: `iframe` is no longer in the default ALLOWED_TAGS, so this function
 * is effectively a no-op for the default config. It is retained as defence-in-depth
 * in case `srcdoc` appears via other means.
 */
const sanitizeSrcdocContent = (html: string, purifyConfig: Config): string => {
	if (!html.includes("srcdoc")) return html;

	// In non-browser environments (e.g., SSR), `document` may be unavailable.
	// In that case, fall back to returning the original HTML, which has already
	// been sanitized by DOMPurify before this post-processing step.
	if (typeof document === "undefined" || typeof document.createElement !== "function") {
		return html;
	}

	const container = document.createElement("div");
	container.innerHTML = html;
	const elements = container.querySelectorAll("[srcdoc]");

	if (elements.length === 0) return html;

	for (const el of elements) {
		const srcdocValue = el.getAttribute("srcdoc");
		if (srcdocValue) {
			// Apply iterative sanitization to srcdoc content, matching the
			// same security guarantees as the main sanitization loop
			let sanitized = srcdocValue;
			let prevSanitized = "";
			let iter = 0;
			while (sanitized !== prevSanitized && iter < MAX_SANITIZATION_ITERATIONS) {
				prevSanitized = sanitized;
				sanitized = DOMPurify.sanitize(sanitized, purifyConfig).toString();
				iter++;
			}
			// Recursively sanitize nested srcdoc attributes within the result
			sanitized = sanitizeSrcdocContent(sanitized, purifyConfig);
			el.setAttribute("srcdoc", sanitized);
		}
	}

	return container.innerHTML;
};

export const sanitizeHTMLWithConfig = (
	text: string,
	customAllowedHtmlTags: string[] | undefined,
) => {
	// Use a mutable variable so the hook always compares against the current
	// iteration's input, not the original `text` captured by the closure.
	let currentInput = text;

	DOMPurify.addHook("beforeSanitizeElements", (node: unknown) => {
		if (node instanceof HTMLUnknownElement) {
			const unClosedTag = `<${node.tagName.toLowerCase()}>${node.innerHTML}`;
			const closedTag = `<${node.tagName.toLowerCase()}>${node.innerHTML}</${node.tagName.toLowerCase()}>`;
			node.replaceWith(unClosedTag === currentInput ? unClosedTag : closedTag);
		}
	});

	// Some texts from Agentic AI starts with a </\w+ closing tag which doesn't go through the hooks. Dompurify will remove them.
	// The following will avoid is a fallback
	if (text?.startsWith("</")) {
		DOMPurify.removeAllHooks();
		// Fallback for orphan leading closing tag sequences; escape all angle brackets globally
		return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	let configToUse = config;
	if (customAllowedHtmlTags) {
		// Strip dangerous tags and non-string entries from the tenant-supplied list
		// before passing to DOMPurify (defence-in-depth; mirrors the filter applied
		// in config-reducer.ts in the webchat host so both consumers stay in sync).
		const list = Array.isArray(customAllowedHtmlTags) ? customAllowedHtmlTags : [];
		const safeTags = list.filter(
			(tag): tag is string =>
				typeof tag === "string" && !ALWAYS_BLOCKED_TAGS.has(tag.toLowerCase().trim()),
		);
		configToUse = { ...config, ALLOWED_TAGS: safeTags };
	}

	// Iteratively sanitize until output stabilizes to prevent bypass attacks
	// where nested/obfuscated tags like "<<b>i>" become valid HTML after one pass
	let result = text;
	let previousResult = "";
	let iterations = 0;

	while (result !== previousResult && iterations < MAX_SANITIZATION_ITERATIONS) {
		previousResult = result;
		currentInput = result;
		result = DOMPurify.sanitize(result, configToUse).toString();
		iterations++;
	}

	DOMPurify.removeAllHooks();

	if (iterations > 2) {
		// Legitimate content should typically stabilize in 1–2 iterations.
		// Log cases that require more passes for monitoring/diagnostics.
		console.warn("sanitizeHTMLWithConfig: multiple DOMPurify iterations required", {
			iterations,
		});
	}

	// Post-process: recursively sanitize srcdoc attribute content to prevent
	// XSS via unsanitized HTML inside srcdoc (e.g., <iframe srcdoc="<script>...">)
	result = sanitizeSrcdocContent(result, configToUse);

	return result;
};

/**
 * Sanitizes content if sanitization is enabled.
 * @param content - The content to sanitize.
 * @param isSanitizeEnabled - Whether to sanitize the content.
 * @param customAllowedHtmlTags - Custom HTML tags allowed for sanitization.
 * @returns The sanitized or raw content.
 */
export const sanitizeContent = (
	content: string | undefined,
	isSanitizeEnabled: boolean,
	customAllowedHtmlTags: string[] | undefined,
): string => {
	if (!content) {
		return "";
	}
	return isSanitizeEnabled ? sanitizeHTMLWithConfig(content, customAllowedHtmlTags) : content;
};
