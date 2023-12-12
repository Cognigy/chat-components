import { FC } from "react";
import classes from "./MessageHeader.module.css";
import classnames from "classnames";
import { useMessageContext } from "src/messages/hooks";
import Avatar from "./Avatar";
import { HeaderEllipsis } from "src/assets/svg";
import Typography from "./Typography/Typography";

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

	const isUserMessage = message.source === "user";

	const className = classnames(
		"message-header",
		props.className,
		classes.header,
		isUserMessage ? classes.outgoing : classes.ongoing,
	);

	const recievedAt = message?.timestamp ? Number(message.timestamp) : Date.now();

	return (
		<header className={className} data-testid="message-header">
			{props.enableAvatar && <Avatar />}
			<Typography variant="title2-regular" component="div" className={classes.headerMeta}>
				{!isUserMessage && (
					<>
						<span className={classes["avatar-name"]}>
							{message?.avatarName || "Bot"}
						</span>
						<HeaderEllipsis />
					</>
				)}
				<span>
					<time className={classes.timestamp}>
						{new Date(recievedAt).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</time>
				</span>
			</Typography>
		</header>
	);
};

export default MessageHeader;
