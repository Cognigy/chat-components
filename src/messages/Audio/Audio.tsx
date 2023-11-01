/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useRef, useState } from "react";
import ReactPlayer from "react-player";
import classes from "./Audio.module.css";
import { MessagePasstroughProps } from "../types";
import Controls from "./Controls";

const Audio: FC<MessagePasstroughProps> = props => {
	const { url, altText } =
		props?.message?.data?._cognigy?._webchat?.message?.attachment?.payload || {};

	const playerRef = useRef<ReactPlayer | null>(null);
	const [playing, setPlaying] = useState<boolean>(false);
	const [progress, setProgress] = useState<number>(0);
	const [duration, setDuration] = useState<number>(0);

	const handleFocus = (player: ReactPlayer) => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		// if(!config?.settings.enableAutoFocus) return;

		if (!chatHistory?.contains(document.activeElement)) return;

		setTimeout(() => {
			player.getInternalPlayer()?.focus();
		}, 100);
	};

	const handlePlay = () => {
		setPlaying(true);
	};

	const handlePause = () => {
		setPlaying(false);
	};

	const handleProgress = (state: any) => {
		setProgress(state.played);
	};

	const handleDuration = (duration: number) => {
		setDuration(duration);
	};

	if (!url) return null;

	return (
		<div className={classes.wrapper}>
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
				style={{ display: 'none' }}
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
