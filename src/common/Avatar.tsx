import { FC, useEffect, useState } from "react";
import classes from "./Avatar.module.css";
import classnames from "classnames";
import { useMessageContext } from "src/messages/hooks";
import botAvatar from "src/assets/svg/avatar_bot.svg";
import placeholderAvatar from "src/assets/svg/avatar_placeholder.svg";
interface WebchatAvatarOverrides {
	agentAvatarOverrideUrlOnce?: string;
	botAvatarOverrideUrlOnce?: string;
}

interface AvatarProps {
	className?: string;
}

const Avatar: FC<AvatarProps> = props => {
	const { message } = useMessageContext();
	const [avatarUrl, setAvatarUrl] = useState(placeholderAvatar);

	const overrides: WebchatAvatarOverrides =
		(message?.data as { _webchat?: WebchatAvatarOverrides })?._webchat || {};

	useEffect(() => {
		if (overrides.agentAvatarOverrideUrlOnce) {
			setAvatarUrl(overrides.agentAvatarOverrideUrlOnce);
			return;
		}

		if (overrides.botAvatarOverrideUrlOnce) {
			setAvatarUrl(overrides.botAvatarOverrideUrlOnce);
			return;
		}

		if (message?.avatarUrl) {
			setAvatarUrl(message.avatarUrl);
			return;
		}

		if (message?.source !== "agent") {
			setAvatarUrl(botAvatar);
		}
	}, [
		message.avatarUrl,
		message?.source,
		overrides.agentAvatarOverrideUrlOnce,
		overrides.botAvatarOverrideUrlOnce,
	]);

	const classNames = classnames(
		classes.avatar,
		props.className,
		"webchat-avatar",
		message?.source,
	);

	return (
		<img
			alt=""
			className={classNames}
			src={avatarUrl}
			onError={() => setAvatarUrl(placeholderAvatar)}
			data-testid={`${message?.source || "unknown source"}-avatar`}
		/>
	);
};

export default Avatar;
