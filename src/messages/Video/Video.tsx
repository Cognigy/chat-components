import { FC, useCallback, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import classes from "./Video.module.css";
import mainClasses from "src/main.module.css";
import classnames from "classnames";
import { VideoPlayIcon } from "src/assets/svg";
import { useMessageContext, useRandomId } from "src/messages/hooks";
import { getChannelPayload } from "src/utils";
import { IWebchatVideoAttachment } from "@cognigy/socket-client";

const Video: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { url, altText } =
		(payload?.message?.attachment as IWebchatVideoAttachment)?.payload || {};

	const videoPlayerId = useRandomId("webchat-video-player");
	const videoPlayerRef = useRef<ReactPlayer>(null);

	useEffect(() => {
		// Get the element with tabindex=0 inside video preview and assign the button role and aria-label
		const videoWrapper = document.getElementById(videoPlayerId);
		const videoWrapperFocus = videoWrapper?.querySelector("[tabindex='0']");
		videoWrapperFocus?.setAttribute("role", "button");
		videoWrapperFocus?.setAttribute("aria-label", "Play Video");
	}, []);

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

	// Prevent focus loss from video preview button when the video starts playing by focusing the internal player
	const handleOnStart = () => {
		const internalPlayer = videoPlayerRef.current?.getInternalPlayer();
		internalPlayer?.focus();
	};

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
				ref={videoPlayerRef}
				id={videoPlayerId}
				url={url}
				light
				playing
				controls
				className={classes.player}
				playIcon={<VideoPlayIcon width="35px" height="35px" />}
				width="unset"
				height="unset"
				onReady={handleFocus}
				onStart={handleOnStart}
			/>
		</div>
	);
};

export default Video;
