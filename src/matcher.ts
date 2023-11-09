import { ComponentType } from "react";
import { Text } from "./messages";
import { IWebchatConfig, WebchatMessage } from "./messages/types";
import TextWithButtons from "./messages/TextWithButtons/TextWithButtons";
import { getChannelPayload } from "./utils";
import { IWebchatTemplateAttachment } from "@cognigy/socket-client/lib/interfaces/messageData";
import Image from "src/messages/Image";
import Video from "src/messages/Video";
import Audio from "src/messages/Audio";
import List from "src/messages/List";

export type MatchConfig = {
	rule: (message: WebchatMessage, config?: IWebchatConfig) => boolean;
	component: ComponentType<any>;
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
		rule: message => message?.data?._cognigy?._webchat?.message?.attachment?.type === "image",
		component: Image,
	},
	{
		rule: message => message?.data?._cognigy?._webchat?.message?.attachment?.type === "video",
		component: Video,
	},
	{
		rule: message => message?.data?._cognigy?._webchat?.message?.attachment?.type === "audio",
		component: Audio,
	},
	{
		rule: (message: any) =>
			message?.data?._cognigy?._webchat?.message?.attachment?.payload?.template_type ===
			"list",
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
