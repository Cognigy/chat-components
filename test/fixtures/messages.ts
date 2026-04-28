import { IMessage } from "@cognigy/socket-client";

// ----- Source-variant text messages -----

export const botTextMessage: IMessage = {
	text: "Hello from bot",
	source: "bot",
} as IMessage;

export const userTextMessage: IMessage = {
	text: "Hello from user",
	source: "user",
} as IMessage;

export const agentTextMessage: IMessage = {
	text: "Hello from agent",
	source: "agent",
} as IMessage;

export const engagementTextMessage: IMessage = {
	text: "Engagement message",
	source: "engagement",
} as IMessage;

// ----- Plugin payload shapes -----

// Models a generic / carousel webchat gallery payload. The Gallery matcher
// (src/matcher.ts) reads getChannelPayload(...).message.attachment.payload and
// requires template_type === "generic". `_webchat` works without config;
// `_defaultPreview` would require widgetSettings.enableDefaultPreview.
export const richBotMessage: IMessage = {
	source: "bot",
	data: {
		_cognigy: {
			_webchat: {
				message: {
					attachment: {
						type: "template",
						payload: {
							template_type: "generic",
							elements: [
								{ title: "Item A", subtitle: "Sub A", image_url: "" },
								{ title: "Item B", subtitle: "Sub B", image_url: "" },
							],
						},
					},
				},
			},
		},
	},
} as unknown as IMessage;

// Quick-replies webchat payload. The matcher routes this to TextWithButtons
// based on the presence of quick_replies[] on the _webchat message.
export const quickRepliesBotMessage: IMessage = {
	source: "bot",
	data: {
		_cognigy: {
			_webchat: {
				message: {
					text: "Pick one",
					quick_replies: [
						{ title: "Yes", payload: "yes", content_type: "text" },
						{ title: "No", payload: "no", content_type: "text" },
					],
				},
			},
		},
	},
} as unknown as IMessage;

// ----- Default Preview payloads -----
// Replicate the `_defaultPreview` cases from test/demo.tsx so the matcher's
// `enableDefaultPreview` branch is exercised. Both fixtures ship a contrasting
// `_webchat` payload so a regression that causes the wrong channel to render
// would fail the comparison even after class-name canonicalization.

export const defaultPreviewQuickReplies: IMessage = {
	source: "bot",
	data: {
		_cognigy: {
			_defaultPreview: {
				message: {
					text: "RENDER OK",
					quick_replies: [
						{
							id: 0.44535334241574,
							content_type: "postback",
							payload: "preview-pb-1",
							title: "Preview QR 1",
						},
					],
				},
			},
			_webchat: { message: { text: "RENDER WRONG" } },
		},
	},
} as unknown as IMessage;

export const defaultPreviewText: IMessage = {
	source: "bot",
	data: {
		_cognigy: {
			_webchat: { message: { text: "RENDER WRONG" } },
			_defaultPreview: { message: { text: "RENDER OK" } },
		},
	},
} as unknown as IMessage;

// ----- xApp payloads -----
// Replicate the `xApp Buttons` demo tab. Both shapes route through the
// matcher's `openXApp` content-type branch (quick-reply pill vs. button
// template) and share the openXApp payload type.

export const xAppQuickReply: IMessage = {
	source: "bot",
	data: {
		_cognigy: {
			_default: {
				_quickReplies: {
					type: "quick_replies",
					quickReplies: [
						{
							id: 0.4782026154264929,
							title: "Open xApp",
							imageAltText: "",
							imageUrl: "",
							contentType: "openXApp",
							payload: "https://static.test?testParam=TEST",
						},
					],
					text: "Tap to open the xApp",
				},
			},
			_webchat: {
				message: {
					text: "QR",
					quick_replies: [
						{
							content_type: "openXApp",
							image_url: "",
							image_alt_text: "",
							payload: "https://static.test?testParam=TEST",
							title: "Open xApp",
						},
					],
				},
			},
		},
	},
} as unknown as IMessage;

export const xAppButton: IMessage = {
	source: "bot",
	data: {
		_cognigy: {
			_webchat: {
				message: {
					attachment: {
						type: "template",
						payload: {
							text: "Button",
							template_type: "button",
							buttons: [
								{
									title: "Open XApp Button",
									type: "openXApp",
									payload: "https://static.test?testParam=TEST",
								},
							],
						},
					},
				},
			},
		},
	},
} as unknown as IMessage;

// ----- HTML sanitization payloads -----
// One representative case per non-default sanitization config from the
// `HTML Sanitization` demo tab. Default (no config) is already covered by
// the `botTextMessage` baseline; these exercise the branches that consume
// `widgetSettings.customAllowedHtmlTags` / `layout.disableHtmlContentSanitization`.

export const sanitizedHtmlMessage: IMessage = {
	source: "bot",
	text: "Default sanitization: <p>Paragraph</p> <strong>Bold</strong> <em>Italic</em> <a href='https://example.com'>Link</a> <script>alert('XSS')</script>",
} as IMessage;

export const sanitizedCustomTagsMessage: IMessage = {
	source: "bot",
	text: "Custom allowed tags (only p, strong): <p>Paragraph</p> <strong>Bold</strong> <em>Italic</em> <a href='https://example.com'>Link</a>",
} as IMessage;

export const sanitizationDisabledMessage: IMessage = {
	source: "bot",
	text: "Sanitization disabled: <p>Paragraph</p> <strong>Bold</strong> <em>Italic</em> <a href='https://example.com'>Link</a>",
} as IMessage;

// ----- Markdown / layout-flag text payloads -----
// Pulled from the `Text messages` tab so the renderMarkdown / layout flag
// branches inside Text.tsx are exercised at the DOM-compat layer too.

export const markdownText: IMessage = {
	source: "bot",
	text: "## Heading\n\nA **bold** word and a [link](https://example.com).",
} as IMessage;

export const borderlessText: IMessage = {
	source: "bot",
	text: "This message has the bot output border disabled.",
} as IMessage;

// ----- Collation -----
// `prevMessage` participates in the matcher's collation rules; this fixture
// pair (current + prev) reproduces the `Message Collation` demo's "bot
// follows bot" case where the second message renders without a header.

export const collatedFollowupMessage: IMessage = {
	text: "This message does not have a header (collated)",
	source: "bot",
	timestamp: "1701163319138",
} as IMessage;

export const collatedPrevMessage: IMessage = {
	source: "bot",
	timestamp: "1701163314138",
} as IMessage;
