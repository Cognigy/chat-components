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
	const { message, config } = useMessageContext();

	const directionMapping = config?.settings?.widgetSettings?.sourceDirectionMapping;

	const isUserMessage = message.source === "user";
	const isBotMessage = message.source === "bot";
	const isAgentMessage = message.source === "agent";

	const userMessageDirection = directionMapping?.user || "outgoing";
	const botMessageDirection = directionMapping?.bot || "incoming";
	const agentMessageDirection = directionMapping?.agent || "incoming";

	const className = classnames(
		"message-header",
		props.className,
		classes.header,
		isUserMessage && classes[userMessageDirection],
		isBotMessage && classes[botMessageDirection],
		isAgentMessage && classes[agentMessageDirection],
	);

	const recievedAt = message?.timestamp ? Number(message.timestamp) : Date.now();

	const overrides = (message?.data as any)?._webchat || {};

	let name = message?.avatarName || (isAgentMessage ? "Agent" : "Bot");

	if (overrides.agentAvatarOverrideName) {
		name = overrides.agentAvatarOverrideName;
	}

	if (overrides.botAvatarOverrideName) {
		name = overrides.botAvatarOverrideName;
	}

	return (
		<header className={className} data-testid="message-header">
			{props.enableAvatar && <Avatar />}
			<Typography variant="title2-regular" component="div" className={classes.headerMeta}>
				{!isUserMessage && (
					<>
						<span className={classes["avatar-name"]}>
							{name}
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
