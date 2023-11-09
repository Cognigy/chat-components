import { FC, useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";
import classes from "./Audio.module.css";
import { MessagePasstroughProps } from "../types";
import Controls from "./Controls";
import { OnProgressProps } from "react-player/base";
import { useMessageContext } from "src/hooks";

const Audio: FC<MessagePasstroughProps> = () => {
	const { message } = useMessageContext();
	const { url, altText } = message?.data?._cognigy?._webchat?.message?.attachment?.payload || {};

	const playerRef = useRef<ReactPlayer | null>(null);
	const [playing, setPlaying] = useState<boolean>(false);
	const [progress, setProgress] = useState<number>(0);
	const [duration, setDuration] = useState<number>(0);

	const handleFocus = useCallback((player: ReactPlayer) => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		// if(!config?.settings.enableAutoFocus) return;

		if (!chatHistory?.contains(document.activeElement)) return;

		setTimeout(() => {
			player.getInternalPlayer()?.focus();
		}, 100);
	}, []);

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

	if (!url) return null;

	return (
		<div className={classes.wrapper} data-testid="audio-message">
			<span className={classes.srOnly}>{altText || "Attachment Audio"}</span>
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
			/>
			<Controls
				playerRef={playerRef}
				playing={playing}
				progress={progress}
				duration={duration}
				handlePlay={handlePlay}
				handlePause={handlePause}
			/>
		</div>
	);
};

export default Audio;
