import { ChangeEvent, FC, MutableRefObject } from "react";
import classes from "./Audio.module.css";
import { AudioPause, AudioPlay } from "src/assets/svg";
import ReactPlayer from "react-player";
import Typography from "src/common/Typography";

type ControlsProps = {
	playerRef: MutableRefObject<ReactPlayer | null>;
	playing: boolean;
	progress: number;
	duration: number;
	altText: string;
	handlePlay: () => void;
	handlePause: () => void;
};

const Controls: FC<ControlsProps> = props => {
	const { playerRef, playing, progress, duration, altText, handlePlay, handlePause } = props;

	const togglePlayAndPause = () => {
		if (playing) {
			handlePause();
		} else {
			handlePlay();
		}
	};

	const handleSeekStart = () => {
		handlePause();
	};

	const handleSeekChange = (e: ChangeEvent<HTMLInputElement>) => {
		playerRef.current?.seekTo(parseFloat(e.target.value));
	};

	const handleSeekEnd = () => {
		handlePlay();
	};

	const formatTime = () => {
		const padString = (string: number) => {
			return ("0" + string).slice(-2);
		};

		const seconds = duration * (1 - Math.min(1, progress));
		const date = new Date(seconds * 1000);
		const hh = date.getUTCHours();
		const mm = date.getUTCMinutes();
		const ss = padString(date.getUTCSeconds());
		if (hh) {
			return `${hh}:${padString(mm)}:${ss}`;
		}
		return `${mm}:${ss}`;
	};

	return (
		<div className={classes.audioWrapper} data-testid="audio-controls">
			<div className={classes.controls}>
				<div className="duration">
					<time>{formatTime()}</time>
				</div>

				<div className={classes.progressBar}>
					<input
						type="range"
						min={0}
						max={0.999999}
						step="any"
						value={progress}
						onMouseDown={handleSeekStart}
						onTouchStart={handleSeekStart}
						onChange={handleSeekChange}
						onMouseUp={handleSeekEnd}
						onTouchEnd={handleSeekEnd}
						style={{
							background: `linear-gradient(to right, var(--cc-primary-color) ${
								progress * 100
							}%, var(--cc-black-80) ${progress * 100}%)`,
						}}
					/>
				</div>

				<div className="buttons">
					<button className={classes.playButton} onClick={togglePlayAndPause}>
						{playing ? <AudioPause /> : <AudioPlay />}
					</button>
				</div>
			</div>
			{/* TODO:  */}
			{/* <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(altText)}`} download="transcript.txt">test</a> */}
			{altText && (
				<Typography
					variant="title2-regular"
					component="p"
					className={classes.audioTranscript}
				>
					Transcribed text: {altText}
				</Typography>
			)}
		</div>
	);
};

export default Controls;
