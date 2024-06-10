import { FC, useMemo } from "react";
import classnames from "classnames";

import MessageHeader from "../common/MessageHeader";
import { match, MatchConfig } from "../matcher";
import { MessageProvider } from "./context";
import { IWebchatConfig, MessageSender } from "./types";

import "src/theme.module.css";
import classes from "./Message.module.css";
import { isMessageCollatable } from "../utils";
import { IMessage } from "@cognigy/socket-client";

export interface MessageProps {
	action?: MessageSender;
	className?: string;
	config?: IWebchatConfig;
	disableHeader?: boolean;
	hasReply?: boolean;
	message: IMessage;
	onEmitAnalytics?: (event: string, payload?: unknown) => void;
	plugins?: MatchConfig[];
	prevMessage?: IMessage;
	isConversationEnded?: boolean;
	openXAppOverlay?: (url: string | undefined) => void;
}

const Message: FC<MessageProps> = props => {
	const {
		action,
		className,
		config,
		hasReply,
		message,
		onEmitAnalytics,
		plugins,
		prevMessage,
		isConversationEnded,
		openXAppOverlay,
	} = props;
	const shouldCollate = isMessageCollatable(message, prevMessage);

	const rootClassName = classnames(
		"webchat-message-row",
		message.source,
		className,
		classes.message,
		shouldCollate && classes.collated,
	);

	const MessageComponent = match(message, config, plugins);

	const messageParams = useMemo(
		() => ({ hasReply, isConversationEnded }),
		[hasReply, isConversationEnded],
	);

	/**
	 * No rule matched the message, so we don't render anything.
	 */
	if (!MessageComponent) {
		return null;
	}

	return (
		<MessageProvider
			message={message}
			action={action}
			onEmitAnalytics={onEmitAnalytics}
			config={config}
			messageParams={messageParams}
			openXAppOverlay={openXAppOverlay}
		>
			<article className={rootClassName}>
				{!shouldCollate && <MessageHeader enableAvatar={message.source !== "user"} />}
				<MessageComponent />
			</article>
		</MessageProvider>
	);
};

export default Message;
