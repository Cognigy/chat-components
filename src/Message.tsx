import { FC } from "react";
import classnames from "classnames";

import classes from "./Message.module.css";
import ChatBubble from "./common/ChatBubble";
import Header from "./common/Header";
import { match, MatchConfig } from "./matcher";

type MessageSource = "agent" | "user" | "bot";
type MessageContent = any;

export interface MessageProps {
	action?: () => void;
	className?: string;
	message: MessageContent;
	plugins?: MatchConfig[];
	source: MessageSource;
}

const Message: FC<MessageProps> = props => {
	const rootClassName = classnames(
		"webchat-message-row",
		props.className,
		props.source,
		classes.message,
	);

	const MessageComponent = match(props.message, props.plugins);

	return (
		<article className={rootClassName}>
			<Header />
			<ChatBubble><MessageComponent action={props.action} message={props.message} /></ChatBubble>
		</article>
	);
};

export default Message;
