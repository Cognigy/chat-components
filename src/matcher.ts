import { Text } from "./messages";
import Image from "./messages/Image";

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
		rule: (message: any) => {
			console.log(message);
			return message?.data?._cognigy?._webchat?.message?.attachment?.type === "image"
		},
		component: Image
	}
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
