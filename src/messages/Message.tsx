import { FC } from "react";
import classnames from "classnames";

import MessageHeader from "../common/MessageHeader";
import { match, MatchConfig } from "../matcher";
import { MessageProvider } from "./context";
import { IWebchatConfig, MessageSender, WebchatMessage } from "./types";

import "src/theme.css";
import classes from "./Message.module.css";
import { isMessageCollatable } from "../utils";

export interface MessageProps {
	action?: MessageSender;
	className?: string;
	config?: IWebchatConfig;
	message: WebchatMessage;
	onEmitAnalytics?: (event: string, payload?: unknown) => void;
	plugins?: MatchConfig[];
	prevMessage?: WebchatMessage;
}

const Message: FC<MessageProps> = props => {
	const shouldCollate = isMessageCollatable(props.message, props.prevMessage);

	const rootClassName = classnames(
		"webchat-message-row",
		props.message.source,
		props.className,
		classes.message,
		shouldCollate && classes.collated,
	);

	const MessageComponent = match(props.message, props.config, props.plugins);

	/**
	 * No rule matched the message, so we don't render anything.
	 */
	if (!MessageComponent) {
		return null;
	}

	return (
		<MessageProvider
			message={props.message}
			action={props.action}
			onEmitAnalytics={props.onEmitAnalytics}
			config={props.config}
		>
			<article className={rootClassName}>
				{!shouldCollate && <MessageHeader enableAvatar={props.message.source !== "user"} />}
				<MessageComponent />
			</article>
		</MessageProvider>
	);
};

export default Message;
