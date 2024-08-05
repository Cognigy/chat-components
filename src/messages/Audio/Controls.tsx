import { ChangeEvent, FC, MutableRefObject, useRef } from "react";
import classes from "./Audio.module.css";
import { AudioPause, AudioPlay, DownloadIcon } from "src/assets/svg";
import ReactPlayer from "react-player";
import { Tooltip } from "react-tooltip";

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

	const downloadTranscriptLinkRef = useRef<HTMLAnchorElement>(null);

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

	const handleDownloadTranscript = () => {
		if (downloadTranscriptLinkRef.current) {
			downloadTranscriptLinkRef.current.click();
		}
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
			{/* Button to download audio transcript with tooltip */}
			<button
				onClick={handleDownloadTranscript}
				aria-label="Download transcript"
				className={classes.downloadButton}
				data-tooltip-id="downloadTranscriptButton"
				data-tooltip-place="top"
				data-tooltip-content="Download transcript"
			>
				<DownloadIcon />
			</button>
			<Tooltip id="downloadTranscriptButton" globalCloseEvents={{ escape: true }} />
			<a
				ref={downloadTranscriptLinkRef}
				href={`data:text/plain;charset=utf-8,${encodeURIComponent(altText)}`}
				download="audio-transcript.txt"
				style={{ display: "none" }}
				aria-hidden="true"
			/>
		</div>
	);
};

export default Controls;
