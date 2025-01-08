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
	const disableBotOutputBorder = config?.settings?.layout?.disableBotOutputBorder;
	const botOutputMaxWidth = config?.settings?.layout?.botOutputMaxWidth;

	const isUserMessage = message.source === "user";
	const isBotMessage = message.source === "bot";
	const isAgentMessage = message.source === "agent";

	const disableBorder = isBotMessage && disableBotOutputBorder;

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
		disableBorder && classes.disableBorder,
	);

	const style = isBotMessage && botOutputMaxWidth ? { maxWidth: `${botOutputMaxWidth}%` } : {};

	return <div className={classNames} style={style}>{props.children}</div>;
};

export default ChatBubble;
