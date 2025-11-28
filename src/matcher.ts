import React, { FC } from "react";
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
} from "./messages";
import { IWebchatConfig } from "./messages/types";
import { getChannelPayload } from "./utils";
import { IMessage, IWebchatTemplateAttachment } from "@cognigy/socket-client";
import { IAdaptiveCardMessage } from "@cognigy/socket-client/lib/interfaces/messageData";
import { XAppSubmitMessage } from "./messages/xApp";
import type { MessageProps } from "./messages/Message";
import Webchat3Event from "./messages/Webchat3Event";

export type MatchConfig = {
	match: (message: IMessage, config?: IWebchatConfig) => boolean;
	component: FC;
	name?: string;
	options?: MessagePluginOptions;
};

const defaultConfig: MatchConfig[] = [
	{
		// xApp submit
		match: message => {
			return message?.data?._plugin?.type === "x-app-submit";
		},
		component: XAppSubmitMessage,
	},
	{
		// Webchat3Event
		match: message => {
			return !!message?.data?._cognigy?._webchat3?.type;
		},
		component: Webchat3Event,
	},
	{
		// Datepicker
		match: message => {
			return message?.data?._plugin?.type === "date-picker";
		},
		component: DatePicker,
	},
	{
		// Text with buttons / Quick Replies
		match: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			const isQuickReplies =
				channelConfig?.message?.quick_replies &&
				channelConfig.message.quick_replies.length > 0;
			const isTextWithButtons =
				(channelConfig?.message?.attachment as IWebchatTemplateAttachment)?.payload
					?.template_type === "button";

			const hasMessengerText = channelConfig?.message?.text;

			const isDefaultPreviewEnabled = config?.settings?.widgetSettings?.enableDefaultPreview;
			const hasDefaultPreview = message?.data?._cognigy?._defaultPreview;
			// DefaultPreview chooses text over _webchat / _facebook content
			const shouldSkip = isDefaultPreviewEnabled && !hasDefaultPreview && message.text;

			return !shouldSkip && (isQuickReplies || isTextWithButtons || hasMessengerText);
		},
		component: TextWithButtons,
	},
	{
		// Image
		match: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "image";
		},
		component: Image,
	},
	{
		// Video
		match: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "video";
		},
		component: Video,
	},
	{
		// Audio
		match: (message, config) => {
			const channelConfig = getChannelPayload(message, config);
			if (!channelConfig) return false;

			return channelConfig?.message?.attachment?.type === "audio";
		},
		component: Audio,
	},
	{
		// File
		match: message => {
			const attachments = message?.data?.attachments;
			if (!attachments) return false;

			return true;
		},
		component: File,
	},
	{
		// List
		match: (message, config) => {
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
		match: (message, config) => {
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
		// Adaptive Card
		match: (message, config) => {
			const _webchat = (message?.data?._cognigy?._webchat as IAdaptiveCardMessage)
				?.adaptiveCard;

			const _defaultPreview = message?.data?._cognigy?._defaultPreview?.adaptiveCard;

			const _plugin = message?.data?._plugin?.type === "adaptivecards";
			const defaultPreviewEnabled = config?.settings?.widgetSettings?.enableDefaultPreview;

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
	{
		// Text message
		match: (message, config) => {
			// do not render engagement messages unless configured!
			// do not render messages with file attachments. It will be rendered by the File component
			if (
				(message?.source === "engagement" &&
					!config?.settings?.teaserMessage?.showInChat) ||
				message?.data?.attachments
			) {
				return false;
			}

			// handle message arrays (from streaming mode)
			if (Array.isArray(message?.text)) {
				return message?.text.length > 0;
			}
			// Handle messages from LLMs if it only contains any escape sequences and collation is disabled
			if (
				message.text?.match?.(/^(?:[\n\t\r\f\b\v\s])+$/)?.length &&
				!config?.settings.behavior.collateStreamedOutputs
			)
				return false;

			return message?.text !== null && message?.text !== undefined && message?.text !== "";
		},
		component: Text,
		name: "Text",
	},
];

/**
 * Matches a message to a component.
 * Accepts `externalPlugins` to extend with custom matchs.
 */
export function match(
	message: IMessage,
	webchatConfig?: IWebchatConfig,
	externalPlugins: MessagePlugin[] = [],
) {
	const config = [...externalPlugins, ...defaultConfig];

	const plugins: MessagePlugin[] = [];

	for (const plugin of config) {
		if (plugin.match(message, webchatConfig)) {
			plugins.push(plugin);
			if (!plugin?.options?.passthrough) {
				break;
			}
		}
	}

	return plugins;
}

export interface MessagePluginOptions {
	fullscreen?: boolean;
	fullwidth?: boolean;
	passthrough?: boolean;
}

export interface MessagePlugin {
	name?: string;
	match: (message: IMessage, config?: IWebchatConfig) => boolean;
	component: React.ComponentType<MessageProps>;
	options?: MessagePluginOptions;
}
