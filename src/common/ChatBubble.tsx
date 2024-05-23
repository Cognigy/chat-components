import React, { FC } from "react";
import classes from "./ChatBubble.module.css";
import classnames from "classnames";
import { useMessageContext } from "src/messages/hooks";

interface IChatBubbleProps {
	className?: string;
	children: React.ReactNode;
}

const ChatBubble: FC<IChatBubbleProps> = props => {
	const { message, config } = useMessageContext();
	const directionMapping = config?.settings?.widgetSettings?.sourceDirectionMapping;

	const isUserMessage = message.source === "user";
	const isBotMessage = message.source === "bot";
	const isAgentMessage = message.source === "agent";

	const userMessageDirection = directionMapping?.user || "outgoing";
	const botMessageDirection = directionMapping?.bot || "incoming";
	const agentMessageDirection = directionMapping?.agent || "incoming";

	const classNames = classnames(
		classes.bubble,
		props.className,
		"chat-bubble",
		isUserMessage && classes[userMessageDirection],
		isBotMessage && classes[botMessageDirection],
		isAgentMessage && classes[agentMessageDirection],
	);

	return <div className={classNames}>{props.children}</div>;
};

export default ChatBubble;
