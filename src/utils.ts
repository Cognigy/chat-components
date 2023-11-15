import { IWebchatMessage } from "@cognigy/socket-client/lib/interfaces/messageData";
import { IWebchatConfig, WebchatMessage } from "./messages/types";
import { ActionButtonsProps } from "./common/ActionButtons/ActionButtons";

/**
 * Decides between _webchat and _facebook payload.
 */
export function getChannelPayload(message: WebchatMessage, config?: IWebchatConfig) {
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

export const getRandomId = (prefix = "") => {
	const id =
		typeof self?.crypto?.randomUUID === "function" ? window.crypto.randomUUID() : Date.now();

	return prefix ? `${prefix}-${id}` : id;
};
