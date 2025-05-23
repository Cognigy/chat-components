import { FC, useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";
import classes from "./Audio.module.css";
import classnames from "classnames";
import Controls from "./Controls";
import { OnProgressProps } from "react-player/base";
import { useLiveRegion, useMessageContext } from "src/messages/hooks";
import { getChannelPayload } from "src/utils";
import { IWebchatAudioAttachment } from "@cognigy/socket-client";

const Audio: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { url, altText } =
		(payload?.message?.attachment as IWebchatAudioAttachment)?.payload || {};

	const playerRef = useRef<ReactPlayer | null>(null);
	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);

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

	const handlePlay = useCallback(() => {
		setPlaying(true);
	}, []);

	const handlePause = useCallback(() => {
		setPlaying(false);
	}, []);

	const handleProgress = useCallback((state: OnProgressProps) => {
		setProgress(state.played);
	}, []);

	const handleDuration = useCallback((duration: number) => {
		setDuration(duration);
	}, []);

	useLiveRegion({
		messageType: "audio",
		data: { hasTranscript: !!altText },
		validation: () => !!url,
	});

	if (!url) return null;

	return (
		<div
			className={classnames("webchat-media-template-audio", classes.wrapper)}
			data-testid="audio-message"
		>
			<ReactPlayer
				url={url}
				onReady={handleFocus}
				ref={playerRef}
				playing={playing}
				onPlay={handlePlay}
				onPause={handlePause}
				onProgress={handleProgress}
				onDuration={handleDuration}
				height={0}
				width={0}
				style={{ display: "none" }}
				progressInterval={0.1}
			/>
			<Controls
				playerRef={playerRef}
				playing={playing}
				progress={progress}
				duration={duration}
				handlePlay={handlePlay}
				handlePause={handlePause}
				altText={altText}
			/>
		</div>
	);
};

export default Audio;
