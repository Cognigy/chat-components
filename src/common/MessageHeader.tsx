import { FC, useEffect } from "react";
import classes from "./MessageHeader.module.css";
import classnames from "classnames";
import mainClasses from "src/main.module.css";
import { useMessageContext } from "src/messages/hooks";
import Avatar from "./Avatar";
import { HeaderEllipsis } from "src/assets/svg";
import Typography from "./Typography/Typography";
import { getDateLocale, interpolateString } from "src/utils";

interface MessageHeaderProps {
	enableAvatar?: boolean;
	className?: string;
}

interface WebchatOverrides {
	agentAvatarOverrideNameOnce?: string;
	botAvatarOverrideNameOnce?: string;
}

/**
 * Message Header consists of:
 * - Avatar (optional)
 * - Timestamp
 */
const MessageHeader: FC<MessageHeaderProps> = props => {
	const { message, config, onSetHeaderInfo } = useMessageContext();

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

	const overrides: WebchatOverrides =
		(message?.data as { _webchat?: WebchatOverrides })?._webchat || {};

	let name = message?.avatarName || (isAgentMessage ? "Agent" : "Bot");

	if (overrides.agentAvatarOverrideNameOnce) {
		name = overrides.agentAvatarOverrideNameOnce;
	}

	if (overrides.botAvatarOverrideNameOnce) {
		name = overrides.botAvatarOverrideNameOnce;
	}

	// undefined (no or an invalid customTranslations.dateLocale) uses the browser's locale
	const dateLocale = getDateLocale(config);

	const timestamp = new Date(recievedAt).toLocaleTimeString(dateLocale, {
		hour: "2-digit",
		minute: "2-digit",
	});

	const timestampTemplate =
		config?.settings.customTranslations?.ariaLabels?.messageHeader?.timestamp ?? "At {time},";
	const timestampLabel = interpolateString(timestampTemplate, { time: timestamp });

	const sourceInfo = isUserMessage
		? (config?.settings.customTranslations?.ariaLabels?.messageHeader?.user ?? "You said:")
		: interpolateString(
				config?.settings.customTranslations?.ariaLabels?.messageHeader?.bot ??
					"{name} said:",
				{
					name,
				},
			);

	useEffect(() => {
		if (onSetHeaderInfo) {
			onSetHeaderInfo(sourceInfo);
		}
	}, [onSetHeaderInfo, sourceInfo]);

	return (
		<header className={className} data-testid="message-header">
			{props.enableAvatar && <Avatar />}
			<span className={mainClasses.srOnly}>
				<span data-skip-live-region>{timestampLabel}</span>
				{sourceInfo}
			</span>
			<Typography
				variant="title2-regular"
				component="div"
				className={classes.headerMeta}
				aria-hidden={true}
			>
				{!isUserMessage && (
					<>
						<span data-testid="sender-name" className={classes["avatar-name"]}>
							{name}
						</span>
						<HeaderEllipsis />
					</>
				)}
				<span>
					<time className={classes.timestamp}>{timestamp}</time>
				</span>
			</Typography>
		</header>
	);
};

export default MessageHeader;
