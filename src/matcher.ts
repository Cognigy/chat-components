import { FunctionComponent } from "react";
import { Text, Image, Video, Audio, List, Gallery, TextWithButtons, DatePicker } from "./messages";
import { IWebchatConfig } from "./messages/types";
import { getChannelPayload } from "./utils";
import { IMessage, IWebchatTemplateAttachment } from "@cognigy/socket-client";

export type MatchConfig = {
	rule: (message: IMessage, config?: IWebchatConfig) => boolean;
	component: FunctionComponent;
};

const defaultConfig: MatchConfig[] = [
	{
		// Text message
		rule: (message, config) => {
			// do not render engagement messages unless configured!
			if (
				message?.source === "engagement" &&
				!config?.settings?.showEngagementMessagesInChat
			) {
				return false;
			}

			return !!message?.text;
		},
		component: Text,
	},
	{
		// Datepicker
		rule: (message) => {
			// @ts-expect-error -> need to update IMessage type on socketclient
			return message?.data?._plugin?.type === "date-picker";
		},
		component: DatePicker,
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

			return (
				(channelConfig.message?.attachment as IWebchatTemplateAttachment)?.payload
					?.template_type === "list"
			);
		},
		component: List,
	},
	{
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return (
				(channelConfig.message?.attachment as IWebchatTemplateAttachment)?.payload
					?.template_type === "generic"
			);
		},
		component: Gallery,
	},
];

/**
 * Matches a message to a component by given rule.
 * Accepts `configExtended` to extend with custom rules.
 */
export function match(
	message: IMessage,
	webchatConfig?: IWebchatConfig,
	configExtended: MatchConfig[] = [],
) {
	const config = [...configExtended, ...defaultConfig];

	const match = config.find((matcher: MatchConfig) => matcher.rule(message, webchatConfig));

	if (match && match.component) {
		return match.component;
	}

	return null;
}
