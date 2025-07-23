import DOMPurify, { Config } from "dompurify";
import { useMessageContext } from "src/messages/hooks";

export const allowedHtmlTags = [
	"a",
	"abbr",
	"acronym",
	"address",
	"applet",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"base",
	"basefont",
	"bdi",
	"bdo",
	"big",
	"blockquote",
	"body",
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
	"embed",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"form",
	"frame",
	"frameset",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hr",
	"html",
	"i",
	"iframe",
	"img",
	"input",
	"ins",
	"kbd",
	"label",
	"legend",
	"li",
	"link",
	"main",
	"map",
	"mark",
	"meta",
	"meter",
	"nav",
	"noframes",
	"object",
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
	"style",
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

export const allowedHtmlAttributes = [
	"accept",
	"accept-charset",
	"accesskey",
	"action",
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
	"formaction",
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
	"sandbox",
	"scope",
	"selected",
	"shape",
	"size",
	"sizes",
	"span",
	"spellcheck",
	"src",
	"srcdoc",
	"srclang",
	"srcset",
	"start",
	"step",
	"style",
	"tabindex",
	"target",
	"title",
	"translate",
	"type",
	"usemap",
	"value",
	"width",
	"wrap",
];

const config: Config = {
	ALLOWED_TAGS: allowedHtmlTags,
	ALLOWED_ATTR: allowedHtmlAttributes,
};

export const useSanitize = () => {
	const { config } = useMessageContext();
	const isSanitizeEnabled = !config?.settings?.layout?.disableHtmlContentSanitization;
	const customAllowedHtmlTags = config?.settings?.widgetSettings?.customAllowedHtmlTags;

	const sanitizeHTML = (text: string) => {
		if (!isSanitizeEnabled) return text;
		return sanitizeHTMLWithConfig(text, customAllowedHtmlTags);
	};

	return {
		sanitizeHTML,
		isSanitizeEnabled,
	};
};

export const sanitizeHTMLWithConfig = (text: string, customAllowedHtmlTags: string[] = []) => {
	DOMPurify.addHook("beforeSanitizeElements", (node: Element) => {
		if (node instanceof HTMLUnknownElement) {
			const unClosedTag = `<${node.tagName.toLowerCase()}>${node.innerHTML}`;
			const closedTag = `<${node.tagName.toLowerCase()}>${node.innerHTML}</${node.tagName.toLowerCase()}>`;
			node.replaceWith(unClosedTag === text ? unClosedTag : closedTag);
		}
	});

	// Some texts from Agentic AI starts with a </\w+ closing tag which doesn't go through the hooks. Dompurify will remove them.
	// The following will avoid is a fallback
	if (text?.startsWith("</")) return text.replace("<", "&lt;").replace(">", "&gt;");
	const configToUse =
		customAllowedHtmlTags && customAllowedHtmlTags.length > 0
			? { ...config, ALLOWED_TAGS: customAllowedHtmlTags }
			: config;

	const result = DOMPurify.sanitize(text, configToUse).toString();
	DOMPurify.removeAllHooks();
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
	customAllowedHtmlTags: string[] = [],
): string => {
	if (!content) {
		return "";
	}
	return isSanitizeEnabled ? sanitizeHTMLWithConfig(content, customAllowedHtmlTags) : content;
};
