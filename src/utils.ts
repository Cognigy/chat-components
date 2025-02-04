import { IMessage, IWebchatMessage } from "@cognigy/socket-client";
import { IWebchatConfig } from "./messages/types";
import { ActionButtonsProps } from "./common/ActionButtons/ActionButtons";

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
	private lastBotMessage: string = '';

	isMessageCollatable(message: IMessage, prevMessage?: IMessage) {
		const COLLATION_LIMIT = 1000 * 60; // 60 sec

		const difference = Number(message?.timestamp) - Number(prevMessage?.timestamp);

		if (message.source === "user") this.lastBotMessage = ''

		// XAppSubmitMessages is a pill, and should always be collated
		if (message?.data?._plugin?.type === "x-app-submit") return true;

		// if the previous message was a rating message that displays an event status pill, don't collate
		if (
			prevMessage?.source === "user" &&
			prevMessage?.data?._cognigy?.controlCommands?.[0]?.type === "setRating" &&
			prevMessage?.data?._cognigy?.controlCommands?.[0]?.parameters?.showRatingStatus === true
		)
			return false;

		// If the previous bot message is empty and this is the first message, don't collate
		if (prevMessage && prevMessage.source === message.source && !prevMessage.text && !this.lastBotMessage) return false;

		const isCollatable = (
			prevMessage &&
			isNaN(difference) === false &&
			difference < COLLATION_LIMIT &&
			prevMessage?.source === message?.source
		)

		if (message.source === 'bot' && message.text) this.lastBotMessage = message.text;

		return isCollatable;
	}

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
