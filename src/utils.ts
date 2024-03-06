import { IMessage, IWebchatMessage } from "@cognigy/socket-client";
import { IWebchatConfig } from "./messages/types";
import { ActionButtonsProps } from "./common/ActionButtons/ActionButtons";

/**
 * Decides between _webchat and _facebook payload.
 */
export function getChannelPayload(message: IMessage, config?: IWebchatConfig) {
	const { _facebook, _webchat } = message?.data?._cognigy || {};

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

export const isMessageCollatable = (message: IMessage, prevMessage?: IMessage) => {
	const COLLATION_LIMIT = 1000 * 60; // 60 sec

	const difference = Number(message?.timestamp) - Number(prevMessage?.timestamp);

	// XAppSubmitMessages should is a pill, and should always be collated
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
	const urlMatcherRegex = /(\b(https?):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;

	if (typeof text !== "string") return text;

	const enhancedText = text.replace(urlMatcherRegex, url => {
		return `<a href="${url}" target="_blank">${url}</a>`;
	});

	return enhancedText;
};
