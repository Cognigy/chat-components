import { FC } from "react";
import classnames from "classnames";

import classes from "./Message.module.css";
import "./theme.css";
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
			<MessageComponent action={props.action} message={props.message} />
		</article>
	);
};

export default Message;
