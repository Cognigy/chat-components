import { FC } from "react";
import classnames from "classnames";

import classes from "./Message.module.css";
import ChatBubble from "./common/ChatBubble";
import Header from "./common/Header";
import { match, MatchConfig } from "./matcher";

type MessageContent = any;

export interface MessageProps {
	action?: () => void;
	className?: string;
	message: MessageContent;
	plugins?: MatchConfig[];
	onEmitAnalytics?: (event: string, payload?: any) => void;
}

const Message: FC<MessageProps> = props => {
	const rootClassName = classnames(
		"webchat-message-row",
		props.className,
		props.message.source,
		classes.message,
	);

	const MessageComponent = match(props.message, props.plugins);

	if (!MessageComponent) {
		return null;
	}

	return (
		<article className={rootClassName}>
			<Header />
			<ChatBubble>
				<MessageComponent action={props.action} message={props.message} />
			</ChatBubble>
		</article>
	);
};

export default Message;
