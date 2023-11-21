import { FC } from "react";
import classnames from "classnames";

import MessageHeader from "../common/MessageHeader";
import { match, MatchConfig } from "../matcher";
import { MessageProvider } from "./context";
import { IWebchatConfig, MessageSender, WebchatMessage } from "./types";

import "src/theme.css";
import classes from "./Message.module.css";

export interface MessageProps {
	action?: MessageSender;
	className?: string;
	config?: IWebchatConfig;
	disableHeader?: boolean;
	message: WebchatMessage;
	plugins?: MatchConfig[];
	onEmitAnalytics?: (event: string, payload?: unknown) => void;
}

const Message: FC<MessageProps> = props => {
	const rootClassName = classnames(
		"webchat-message-row",
		props.message.source,
		props.className,
		classes.message,
	);

	const MessageComponent = match(props.message, props.plugins, props.config);

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
				{!props.disableHeader && (
					<MessageHeader enableAvatar={props.message.source !== "user"} />
				)}
				<MessageComponent />
			</article>
		</MessageProvider>
	);
};

export default Message;
