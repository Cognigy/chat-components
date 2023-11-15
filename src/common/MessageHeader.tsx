import { FC } from "react";
import classes from "./MessageHeader.module.css";
import classnames from "classnames";
import { useMessageContext } from "../hooks";
import Avatar from "./Avatar";
import { HeaderEllipsis } from "src/assets/svg";

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
		message.source === "user" ? classes.outgoing : classes.ongoing,
	);

	const recievedAt = message?.timestamp ? Number(message.timestamp) : Date.now();

	return (
		<header className={className}>
			{props.enableAvatar && <Avatar />}
			<div className={classes.headerMeta}>
				{message.source === "bot" && (
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
			</div>
		</header>
	);
};

export default MessageHeader;
