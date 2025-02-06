import { IMessage, IWebchatMessage } from "@cognigy/socket-client";
import { IWebchatConfig } from "./messages/types";
import { ActionButtonsProps } from "./common/ActionButtons/ActionButtons";
import { match, MessagePlugin } from "./matcher";

/**
 * Decides between _webchat and _facebook payload.
 */
export function getChannelPayload(message: IMessage, config?: IWebchatConfig) {
	const { _facebook, _webchat, _defaultPreview } = message?.data?._cognigy || {};

	const defaultPreviewEnabled = config?.settings?.widgetSettings?.enableDefaultPreview;

	if (defaultPreviewEnabled && _defaultPreview) {
		return _defaultPreview;
	}

	if (
		config?.settings?.widgetSettings?.enableStrictMessengerSync &&
		message.data?._cognigy?.syncWebchatWithFacebook
	) {
		return _facebook;
	}

	return (_webchat as IWebchatMessage) || _facebook;
}

type getWebchatButtonLabel = (button: ActionButtonsProps["payload"][number]) => string | undefined;

export const getWebchatButtonLabel: getWebchatButtonLabel = button => {
	const { title } = button;

	if (!title && "type" in button && button.type === "phone_number") {
		return "Call";
	}
	return title;
};

export class CollateMessage {
	private firstBotMessage: IMessage | undefined;
	private readonly COLLATION_LIMIT: number = 1000 * 60; // 60 sec

	private isMessageValid(plugins: MessagePlugin[] | undefined, config: IWebchatConfig | undefined, message: IMessage | undefined) {
		if (!message) return false

		const matchedPlugins = match(message, config, plugins);

		if (!matchedPlugins.length) return false;

		return true;
	}

	isMessageCollatable(message: IMessage, config?: IWebchatConfig, plugins?: MessagePlugin[], prevMessage?: IMessage) {

		const difference = Number(message?.timestamp) - Number(prevMessage?.timestamp);

		// XAppSubmitMessages is a pill, and should always be collated
		if (message?.data?._plugin?.type === "x-app-submit") return true;

		
		if (message.source !== 'bot') this.firstBotMessage = undefined;


		// if the previous message was a rating message that displays an event status pill, don't collate
		if (
			prevMessage?.source === "user" &&
			prevMessage?.data?._cognigy?.controlCommands?.[0]?.type === "setRating" &&
			prevMessage?.data?._cognigy?.controlCommands?.[0]?.parameters?.showRatingStatus === true
		)
			return false;


			const isMessageValid = this.isMessageValid(plugins,config,message);
			
		// If this is the first valid bot message don't collate
		if (!this.firstBotMessage && isMessageValid  && message.source === 'bot') {
			this.firstBotMessage = message;
			return false;
		}

		// const isPrevMessageValid = this.isMessageValid(plugins, config, prevMessage);

		// // If the previous message is invalid and the bot hasn't started messaging then don't collate
		// if (prevMessage?.source === 'bot' && !isPrevMessageValid && !this.firstBotMessage) {
		// 	return false;
		// }

		return (
			prevMessage &&
			isNaN(difference) === false &&
			difference < this.COLLATION_LIMIT &&
			prevMessage?.source === message?.source
		);
	};

}

export const isMessageCollatable = (message: IMessage, prevMessage?: IMessage) => {
	const COLLATION_LIMIT = 1000 * 60; // 60 sec

	const difference = Number(message?.timestamp) - Number(prevMessage?.timestamp);

	// XAppSubmitMessages is a pill, and should always be collated
	if (message?.data?._plugin?.type === "x-app-submit") return true;

	// if the previous message was a rating message that displays an event status pill, don't collate
	if (
		prevMessage?.source === "user" &&
		prevMessage?.data?._cognigy?.controlCommands?.[0]?.type === "setRating" &&
		prevMessage?.data?._cognigy?.controlCommands?.[0]?.parameters?.showRatingStatus === true
	)
		return false;

	return (
		prevMessage &&
		isNaN(difference) === false &&
		difference < COLLATION_LIMIT &&
		prevMessage?.source === message?.source
	);
};

export const isEventMessage = (message: IMessage) => {
	return !!message?.data?._cognigy?._webchat3?.type;
};

export const getBackgroundImage = (url: string) => {
	if (!url) return undefined;

	const escapedUrl = url
		.replace(/\n/g, "")
		.replace(/\r/g, "")
		.replace(/"\\/g, char => `\`${char}`);

	return `url("${escapedUrl}")`;
};

export const getRandomId = (prefix = "") => {
	const id = window?.crypto?.randomUUID?.() || Date.now();

	return prefix ? `${prefix}-${id}` : id;
};

/**
 * Helper function that will replace any URL in a string with HTML anchor elements.
 * - Will also work with urls that start with www. or just the domain/subdomain
 * @limitations
 * - This will only match any url at the beginning or following a whitespace, to not break any existing HTML
 * - Will not work with emails
 * @param text The Text that should get URLs replaced with <a> elements
 * @returns The Text with <a> elements in place of the urls
 */
export const replaceUrlsWithHTMLanchorElem = (text: string) => {
	// Enhanced regex to better capture URLs with parameters
	//
	const urlMatcherRegex =
		/(^|\s)(\b(https?):\/\/([-A-Z0-9+&@$#/%?=~_|!:,.;\p{L}]*[-A-Z0-9+&$@#/%=~_|\p{L}]))/giu;

	if (typeof text !== "string") return text;

	const enhancedText = text.replace(urlMatcherRegex, url => {
		return `<a href="${url}" target="_blank">${url}</a>`;
	});

	return enhancedText;
};
