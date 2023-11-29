import { IMessage, IWebchatMessage } from "@cognigy/socket-client";
import { IWebchatConfig } from "./messages/types";
import { ActionButtonsProps } from "./common/ActionButtons/ActionButtons";

/**
 * Decides between _webchat and _facebook payload.
 */
export function getChannelPayload(message: IMessage, config?: IWebchatConfig) {
	const { _facebook, _webchat } = message?.data?._cognigy || {};

	if (
		config?.settings?.enableStrictMessengerSync &&
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
	const urlMatcherRegex =
		/(^|\s)(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/\S*)?/gm;

	if (typeof text !== "string") return text;

	const enhancedText = text.replace(urlMatcherRegex, (url, leadingSymbol) => {
		const trimmedUrl = url.trim();

		let enhancedUrl = trimmedUrl;
		if (!trimmedUrl.startsWith("http")) enhancedUrl = "//" + trimmedUrl;

		return `${leadingSymbol}<a href=${enhancedUrl} target='_blank'>${trimmedUrl}</a>`;
	});

	return enhancedText;
};
