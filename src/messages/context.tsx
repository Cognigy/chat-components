import { createContext, FC, useMemo, ReactNode } from "react";
import { MessageProps } from "./Message";

interface MessageProviderProps extends MessageProps {
	children: ReactNode;
	messageParams?: {
		hasReply: MessageProps["hasReply"];
		isConversationEnded: MessageProps["isConversationEnded"];
	};
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
 * - openXAppOverlay
 * - onSetLiveRegionText
 */
const MessageProvider: FC<MessageProviderProps> = props => {
	const {
		message,
		messageParams,
		action,
		onEmitAnalytics,
		config,
		openXAppOverlay,
		onSetLiveRegionText,
	} = props;

	const contextValue = useMemo(
		() => ({
			message,
			action,
			onEmitAnalytics,
			config,
			messageParams,
			openXAppOverlay,
			onSetLiveRegionText,
		}),
		[
			message,
			action,
			onEmitAnalytics,
			config,
			messageParams,
			openXAppOverlay,
			onSetLiveRegionText,
		],
	);

	return <MessageContext.Provider value={contextValue}>{props.children}</MessageContext.Provider>;
};

export { MessageProvider, MessageContext };
export type { MessageProviderProps };
