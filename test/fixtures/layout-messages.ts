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

export const richBotMessage: IMessage = {
	source: "bot",
	data: {
		_cognigy: {
			_defaultPreview: {
				message: {
					gallery_items: [
						{ title: "Item A", subtitle: "Sub A", image_url: "" },
						{ title: "Item B", subtitle: "Sub B", image_url: "" },
					],
				},
			},
		},
	},
} as unknown as IMessage;
