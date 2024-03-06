import { FC, useCallback } from "react";
import ReactPlayer from "react-player";
import classes from "./Video.module.css";
import mainClasses from "src/main.module.css";
import classnames from "classnames";
import { VideoPlayIcon } from "src/assets/svg";
import { useMessageContext } from "src/messages/hooks";
import { getChannelPayload } from "src/utils";
import { IWebchatVideoAttachment } from "@cognigy/socket-client";

const Video: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { url, altText } =
		(payload?.message?.attachment as IWebchatVideoAttachment)?.payload || {};

	const handleFocus = useCallback(
		(player: ReactPlayer) => {
			const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

			if (!config?.settings?.widgetSettings?.enableAutoFocus) return;

			if (!chatHistory?.contains(document.activeElement)) return;

			setTimeout(() => {
				player.getInternalPlayer()?.focus();
			}, 100);
		},
		[config?.settings?.widgetSettings?.enableAutoFocus],
	);

	if (!url) return null;

	return (
		<div
			className={classnames(classes.wrapper, "webchat-media-template-video")}
			data-testid="video-message"
		>
			<span className={classnames(mainClasses.srOnly, "sr-only")}>
				{altText || "Attachment Video"}
			</span>
			<ReactPlayer
				url={url}
				light
				playing
				controls
				className={classes.player}
				playIcon={<VideoPlayIcon width="35px" height="35px" />}
				width="unset"
				height="unset"
				onReady={handleFocus}
			/>
		</div>
	);
};

export default Video;
