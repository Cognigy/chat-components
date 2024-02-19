import { FC, useMemo } from "react";
import classnames from "classnames";

import MessageHeader from "../common/MessageHeader";
import { match, MatchConfig } from "../matcher";
import { MessageProvider } from "./context";
import { IWebchatConfig, MessageSender } from "./types";

import "src/theme.css";
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
		() => ({ hasReply: hasReply, isConversationEnded: isConversationEnded }),
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
		>
			<article className={rootClassName}>
				{!shouldCollate && <MessageHeader enableAvatar={message.source !== "user"} />}
				<MessageComponent />
			</article>
		</MessageProvider>
	);
};

export default Message;
