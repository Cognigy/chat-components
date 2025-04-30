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
 * - data-message-id
 */
const MessageProvider: FC<MessageProviderProps> = props => {
	const {
		message,
		messageParams,
		"data-message-id": dataMessageId,
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
			"data-message-id": dataMessageId,
			openXAppOverlay,
			onSetLiveRegionText,
		}),
		[
			message,
			action,
			onEmitAnalytics,
			config,
			messageParams,
			dataMessageId,
			openXAppOverlay,
			onSetLiveRegionText,
		],
	);

	return <MessageContext.Provider value={contextValue}>{props.children}</MessageContext.Provider>;
};

export { MessageProvider, MessageContext };
export type { MessageProviderProps };
