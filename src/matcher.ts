import { Text } from "src/messages";
import Image from "src/messages/Image";
import Video from "src/messages/Video";
import Audio from "src/messages/Audio";
import List from "src/messages/List";

export type MatchConfig = {
	rule: (message: any) => boolean;
	component: React.Component;
};

const defaultConfig = [
	{
		// Text message
		rule: (message: any) => {
			const isTextMessage = !!message?.text;

			if (isTextMessage) return true;
			return false;
		},
		component: Text,
	},
	{
		rule: (message: any) =>
			message?.data?._cognigy?._webchat?.message?.attachment?.type === "image",
		component: Image,
	},
	{
		rule: (message: any) =>
			message?.data?._cognigy?._webchat?.message?.attachment?.type === "video",
		component: Video,
	},
	{
		rule: (message: any) =>
			message?.data?._cognigy?._webchat?.message?.attachment?.type === "audio",
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
export function match(message: any, configExtended: any = []) {
	const config = [...configExtended, ...defaultConfig];

	const match = config.find((matcher: any) => matcher.rule(message));

	if (match && match.component) {
		return match.component;
	}

	return null;
}
