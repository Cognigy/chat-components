import { createContext, FC, useMemo, ReactNode } from "react";
import { MessageProps } from "./Message";

interface MessageProviderProps {
	action?: MessageProps["action"];
	children: ReactNode;
	config?: MessageProps["config"];
	message: MessageProps["message"];
	messageParams?: {
		hasReply: MessageProps["hasReply"];
		isConversationEnded: MessageProps["isConversationEnded"];
	};
	onEmitAnalytics?: MessageProps["onEmitAnalytics"];
}

export type MessageContextValue = Omit<MessageProviderProps, "children"> | undefined;

const MessageContext = createContext<MessageContextValue>(undefined);

/**
 * Context Provider is sharing across
 * all message type components:
 *
 * - message
 * - action
 * - onEmitAnalytics
 * - config
 * - messageParams
 */
const MessageProvider: FC<MessageProviderProps> = props => {
	const { message, messageParams, action, onEmitAnalytics, config } = props;

	const contextValue = useMemo(
		() => ({ message, action, onEmitAnalytics, config, messageParams }),
		[message, action, onEmitAnalytics, config, messageParams],
	);

	return <MessageContext.Provider value={contextValue}>{props.children}</MessageContext.Provider>;
};

export { MessageProvider, MessageContext };
export type { MessageProviderProps };
