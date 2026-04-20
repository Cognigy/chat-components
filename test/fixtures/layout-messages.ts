import { IMessage } from "@cognigy/socket-client";

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
