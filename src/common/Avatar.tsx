import { FC, useEffect, useState } from "react";
import classes from "./Avatar.module.css";
import classnames from "classnames";
import { useMessageContext } from "src/messages/hooks";
import botAvatar from "src/assets/svg/bot.svg";
interface AvatarProps {
	className?: string;
}

const defaultAgentAvatar =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAACOklEQVR4Ae3ZA2ydURwF8P9s2+bjPSdGo0aN08V+URtbL+a8BbO9xfZs2zaCuW7vbDx8uLfp/3dinw+XopRSSimllFJhYm9TjV08wwdoYB0f8ix2mDkTe0p7YIZxDeto/5I6rjHDxGtdkcc72n8H75CXruKn1CAcpi0cHE4NEv9kp+EubXHB3ew08QuH4hFt8cGj5Ajxx9hePE1bYi6k+4gvMJ+29GCe+CEzhvW0ZaQ+PVZ8wDW0ZWatuJfozrqyC9Qluotr2Sra8pOtEtewMkgBrBLXsC9QgX3iGm4EKnBDXOP7QAXeiWt4G6jAW3ENNwMVuCmu4UCgAgc6/DCqE1miO9+7X0oEgtVlF1gjPkiOKHs5Pbx9b2jme7SlxPmSC5we20v8kRjJh6Vt6jlU/JKZztsBj1XcH2zxGG3h4ERqkPgp0R35AhvMOuQT3cVnyRH/O9wt4zjLzaj00/F6/dfj9WrPj9eVUkqpRPeMMTnMxxbu4fWf5uP3uME93IZ5JpcxHi4lzGjWYgPPsom2cNDIs9jAWjNaXJvaw1RyES/SlpmLXGQqHb0Rgsv5hjaEvOJyIt6lWg4nacMNTppcHMu9LqYGL2ijCZ6bGuki0TEVuEIbbXDFVEgU2JsbaWPKRvYOf6C8SBtjLoY6yKbH4h5tvMHd5DgJR6Ivb9E6yK1EX6c3AMGDlRIcZtG6i5ktQWGpywJYKkHxgtMC5yUo1tM6TL0ERes2WkALaAEtEEm0gFJKKaWUUkp9ABvn3SEbw3cFAAAAAElFTkSuQmCC";

const Avatar: FC<AvatarProps> = props => {
	const { message } = useMessageContext();
	const [avatarUrl, setAvatarUrl] = useState(defaultAgentAvatar);

	useEffect(() => {
		if (message?.avatarUrl) {
			setAvatarUrl(message.avatarUrl);
		} else if (message?.source !== "agent") {
			setAvatarUrl(botAvatar);
		}
	}, [message?.avatarUrl, message?.source]);

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
			onError={() => setAvatarUrl(defaultAgentAvatar)}
		/>
	);
};

export default Avatar;
