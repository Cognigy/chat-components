import { FC } from "react";
import {
	Text,
	Image,
	Video,
	Audio,
	File,
	List,
	Gallery,
	TextWithButtons,
	DatePicker,
	AdaptiveCard,
	XApp,
} from "./messages";
import { IWebchatConfig } from "./messages/types";
import { getChannelPayload } from "./utils";
import { IMessage, IWebchatTemplateAttachment } from "@cognigy/socket-client";
import { IAdaptiveCardMessage } from "@cognigy/socket-client/lib/interfaces/messageData";
import { XAppSubmitMessage } from "./messages/xApp";

export type MatchConfig = {
	rule: (message: IMessage, config?: IWebchatConfig) => boolean;
	component: FC;
};

const defaultConfig: MatchConfig[] = [
	{
		// Text message
		rule: (message, config) => {
			// do not render engagement messages unless configured!
			// do not render messages with file attachments. It will be rendered by the File component
			if (
				(message?.source === "engagement" &&
					!config?.settings?.showEngagementMessagesInChat) ||
				message?.data?.attachments
			) {
				return false;
			}

			return !!message?.text;
		},
		component: Text,
	},
	{
		// xApp
		rule: message => {
			return message?.data?._plugin?.type === "x-app";
		},
		component: XApp,
	},
	{
		// xApp submit
		rule: message => {
			return message?.data?._plugin?.type === "x-app-submit";
		},
		component: XAppSubmitMessage,
	},
	{
		// Datepicker
		rule: message => {
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
		// Image
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "image";
		},
		component: Image,
	},
	{
		// Video
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "video";
		},
		component: Video,
	},
	{
		// Audio
		rule: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "audio";
		},
		component: Audio,
	},
	{
		// File
		rule: message => {
			const attachments = message?.data?.attachments;
			if (!attachments) return false;

			return true;
		},
		component: File,
	},
	{
		// List
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
		// Gallery
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
	{
		rule: (message, config) => {
			// Rest of the code...
			const _webchat = (message?.data?._cognigy?._webchat as IAdaptiveCardMessage)
				?.adaptiveCard;
			//@ts-ignore
			const _defaultPreview = message?.data?._cognigy?._defaultPreview?.adaptiveCard;
			//@ts-ignore
			const _plugin = message?.data?._plugin?.type === "adaptivecards";
			const defaultPreviewEnabled = config?.settings?.enableDefaultPreview;

			//@ts-ignore
			if (message.data?._cognigy?._defaultPreview?.message && defaultPreviewEnabled) {
				return false;
			}

			if (
				(_defaultPreview && defaultPreviewEnabled) ||
				(_webchat && _defaultPreview && !defaultPreviewEnabled) ||
				_webchat ||
				_plugin
			) {
				return true;
			}

			return false;
		},
		component: AdaptiveCard,
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
