import { FC, useCallback } from "react";
import ReactPlayer from "react-player";
import classes from "./Video.module.css";
import mainClasses from "src/main.module.css";
import { VideoPlayIcon } from "src/assets/svg";
import { useMessageContext } from "src/hooks";
import { getChannelPayload } from "src/utils";

const Video: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { url, altText } = payload.message.attachment.payload;

	const handleFocus = useCallback(
		(player: ReactPlayer) => {
			const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

			if (!config?.settings.enableAutoFocus) return;

			if (!chatHistory?.contains(document.activeElement)) return;

			setTimeout(() => {
				player.getInternalPlayer()?.focus();
			}, 100);
		},
		[config?.settings.enableAutoFocus],
	);

	if (!url) return null;

	return (
		<div className={classes.wrapper} data-testid="video-message">
			<span className={mainClasses.srOnly}>{altText || "Attachment Video"}</span>
			<ReactPlayer
				url={url}
				light
				playing
				controls
				className={classes.player}
				playIcon={<VideoPlayIcon width="45px" />}
				width="unset"
				height="unset"
				onReady={handleFocus}
			/>
		</div>
	);
};

export default Video;
