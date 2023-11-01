import { FC } from "react";
import ReactPlayer from "react-player";
import classes from "./Video.module.css";
import { MessagePasstroughProps } from "../types";
import { VideoPlayIcon } from "src/assets/svg";

const Video: FC<MessagePasstroughProps> = props => {
	const { url, altText } =
		props?.message?.data?._cognigy?._webchat?.message?.attachment?.payload || {};

	const handleFocus = (player: ReactPlayer) => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		// if(!config?.settings.enableAutoFocus) return;

		if (!chatHistory?.contains(document.activeElement)) return;

		setTimeout(() => {
			player.getInternalPlayer()?.focus();
		}, 100);
	};

	if (!url) return null;

	return (
		<div className={classes.wrapper}>
			<span className={classes.srOnly}>{altText || "Attachment Video"}</span>
			<ReactPlayer
				url={url}
				light
				playing
				controls
				className={classes.player}
				playIcon={<VideoPlayIcon width="50px" height="50px" />}
				width="auto"
				height="auto"
				onReady={handleFocus}
			/>
		</div>
	);
};

export default Video;
