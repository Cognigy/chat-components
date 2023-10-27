import { ComponentType } from "react";
import { Text } from "./messages";
import { MessagePasstroughProps } from "./messages/types";
import TextWithButtons from "./messages/TextWithButtons/TextWithButtons";

export type MatchConfig = {
	rule: (message: any) => boolean;
	component: ComponentType<MessagePasstroughProps>;
};

const defaultConfig: MatchConfig[] = [
	{
		// Text message
		rule: (message) => !!message.text,
		component: Text,
	},
	{
		// Text with buttons
		rule: (message) => message?.data?._cognigy?._webchat?.message?.attachment?.payload?.template_type === "button",
		component: TextWithButtons,
	}
];

/**
 * Matches a message to a component by given rule.
 * Accepts `configExtended` to extend with custom rules.
 */
export function match(message: any, configExtended: MatchConfig[] = []) {
	const config = [...configExtended, ...defaultConfig];

	const match = config.find((matcher: MatchConfig) => matcher.rule(message));

	if (match && match.component) {
		return match.component;
	}

	return null;
}
