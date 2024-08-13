import { FC, useEffect, useState } from "react";
import classes from "./Avatar.module.css";
import classnames from "classnames";
import { useMessageContext } from "src/messages/hooks";
import botAvatar from "src/assets/svg/avatar_bot.svg";
import placeholderAvatar from "src/assets/svg/avatar_placeholder.svg";
interface AvatarProps {
	className?: string;
}

const Avatar: FC<AvatarProps> = props => {
	const { message } = useMessageContext();
	const [avatarUrl, setAvatarUrl] = useState(placeholderAvatar);

	const overrides = (message?.data as any)?._webchat || {};

	useEffect(() => {
		if (overrides.agentAvatarOverrideUrl) {
			setAvatarUrl(overrides.agentAvatarOverrideUrl);
			return;
		}

		if (overrides.botAvatarOverrideUrl) {
			setAvatarUrl(overrides.botAvatarOverrideUrl);
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
		overrides.agentAvatarOverrideUrl,
		overrides.botAvatarOverrideUrl,
	]);

	const classNames = classnames(
		classes.avatar,
		props.className,
		"webchat-avatar",
		message?.source,
	);

	return (
		<img
			alt={`${message?.source} avatar`}
			className={classNames}
			src={avatarUrl}
			onError={() => setAvatarUrl(placeholderAvatar)}
		/>
	);
};

export default Avatar;
