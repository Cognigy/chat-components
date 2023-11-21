import { FunctionComponent } from "react";
import { Text, Image, Video, Audio, List, TextWithButtons } from "./messages";
import { IWebchatConfig, WebchatMessage } from "./messages/types";
import { getChannelPayload } from "./utils";
import { IWebchatTemplateAttachment } from "@cognigy/socket-client/lib/interfaces/messageData";

export type MatchConfig = {
	rule: (message: WebchatMessage, config?: IWebchatConfig) => boolean;
	component: FunctionComponent;
};

const defaultConfig: MatchConfig[] = [
	{
		// Text message
		rule: message => !!message.text,
		component: Text,
	},
	{
		// Text with buttons / Quick Replies
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			const isQuickReplies =
				channelConfig?.message?.quick_replies &&
				channelConfig.message.quick_replies.length > 0;
			const isTextWithButtons =
				(channelConfig?.message?.attachment as IWebchatTemplateAttachment)?.payload
					?.template_type === "button";

			return isQuickReplies || isTextWithButtons;
		},
		component: TextWithButtons,
	},
	{
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "image";
		},
		component: Image,
	},
	{
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "video";
		},
		component: Video,
	},
	{
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "audio";
		},
		component: Audio,
	},
	{
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.payload?.template_type === "list";
		},
		component: List,
	},
];

/**
 * Matches a message to a component by given rule.
 * Accepts `configExtended` to extend with custom rules.
 */
export function match(
	message: WebchatMessage,
	configExtended: MatchConfig[] = [],
	webchatConfig?: IWebchatConfig,
) {
	const config = [...configExtended, ...defaultConfig];

	const match = config.find((matcher: MatchConfig) => matcher.rule(message, webchatConfig));

	if (match && match.component) {
		return match.component;
	}

	return null;
}
