import { FC } from "react";
import classes from "./MessageHeader.module.css";
import classnames from "classnames";
import { useMessageContext } from "../hooks";
import Avatar from "./Avatar";

interface MessageHeaderProps {
	enableAvatar?: boolean;
	className?: string;
}

/**
 * Message Header consists of:
 * - Avatar (optional)
 * - Timestamp
 */
const MessageHeader: FC<MessageHeaderProps> = props => {
	const { message } = useMessageContext();

	const className = classnames(
		"message-header",
		props.className,
		classes.header,
		message.source === "user" && classes.outgoing,
	);

	const recievedAt = message?.timestamp ? Number(message.timestamp) : Date.now();
	const timestamp = (
		<time className={classes.timestamp}>
			{new Date(recievedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
		</time>
	);

	return (
		<header className={className}>
			{props.enableAvatar && <Avatar />}
			{timestamp}
		</header>
	);
};

export default MessageHeader;
