import { ChangeEvent, FC, MutableRefObject, useRef, useMemo, useState, useEffect } from "react";
import classes from "./Audio.module.css";
import {
	DownloadIcon,
	VolumeIcon,
	VolumeXIcon,
	EllipsisVerticalIcon,
	CirclePlayIcon,
	PlayIcon,
	PauseIcon,
} from "src/assets/svg";
import ReactPlayer from "react-player";
import { useMessageContext } from "../hooks";
import { interpolateString } from "src/utils";
import classnames from "classnames";

type ControlsProps = {
	playerRef: MutableRefObject<ReactPlayer | null>;
	playing: boolean;
	progress: number;
	duration: number;
	volume: number;
	muted: boolean;
	playbackRate: number;
	altText: string;
	handlePlay: () => void;
	handlePause: () => void;
	onVolumeChange: (volume: number) => void;
	onMuteToggle: () => void;
	onPlaybackRateChange: (rate: number) => void;
};

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const Controls: FC<ControlsProps> = props => {
	const {
		playerRef,
		playing,
		progress,
		duration,
		volume,
		muted,
		playbackRate,
		altText,
		handlePlay,
		handlePause,
		onVolumeChange,
		onMuteToggle,
		onPlaybackRateChange,
	} = props;

	const downloadTranscriptLinkRef = useRef<HTMLAnchorElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuView, setMenuView] = useState<"main" | "speed">("main");
	const { config } = useMessageContext();

	useEffect(() => {
		if (!menuOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node) &&
				menuButtonRef.current &&
				!menuButtonRef.current.contains(e.target as Node)
			) {
				setMenuOpen(false);
				setMenuView("main");
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [menuOpen]);

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

	const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
		const val = parseFloat(e.target.value);
		onVolumeChange(val);
		if (val > 0 && muted) onMuteToggle();
	};

	const handleDownloadTranscript = () => {
		downloadTranscriptLinkRef.current?.click();
		setMenuOpen(false);
		setMenuView("main");
	};

	const toggleMenu = () => {
		setMenuOpen(o => !o);
		if (menuOpen) setMenuView("main");
	};

	const formatTime = useMemo(() => {
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
	}, [duration, progress]);

	const timeToText = (time: string) => {
		if (time.length < 6) {
			time = `00:${time}`;
		}
		const [hours, minutes, seconds] = time.split(":").map(Number);
		const hoursText = hours ? `${hours} hours ` : "";
		const minutesText = minutes ? `${minutes} minutes ` : "";
		const secondsText = `${seconds} seconds`;
		return `${hoursText}${minutesText}${secondsText}`;
	};

	const audioPlaybackProgressLabel =
		config?.settings?.customTranslations?.ariaLabels?.audioPlaybackProgress ||
		"Audio playback progress";
	const playAudioLabel =
		config?.settings?.customTranslations?.ariaLabels?.playAudio || "Play audio";
	const pauseAudioLabel =
		config?.settings?.customTranslations?.ariaLabels?.pauseAudio || "Pause audio";
	const audioTimeRemainingLabel =
		config?.settings?.customTranslations?.ariaLabels?.audioTimeRemaining ?? "{time} remaining";
	const muteAudioLabel =
		config?.settings?.customTranslations?.ariaLabels?.muteAudio || "Mute audio";
	const unmuteAudioLabel =
		config?.settings?.customTranslations?.ariaLabels?.unmuteAudio || "Unmute audio";
	const volumeLabel =
		config?.settings?.customTranslations?.ariaLabels?.audioVolume || "Audio volume";

	const effectiveVolume = muted ? 0 : volume;

	return (
		<div className={classes.audioWrapper} data-testid="audio-controls">
			<div className={classes.controls}>
				<button
					className={classes.playButton}
					onClick={togglePlayAndPause}
					aria-label={playing ? pauseAudioLabel : playAudioLabel}
				>
					{playing ? <PauseIcon /> : <PlayIcon />}
				</button>

				<div className={classes.progressBar}>
					<input
						type="range"
						min={0}
						max={0.999999}
						step="any"
						value={progress}
						aria-valuetext={interpolateString(audioTimeRemainingLabel, {
							time: timeToText(formatTime),
						})}
						aria-label={audioPlaybackProgressLabel}
						onMouseDown={handleSeekStart}
						onTouchStart={handleSeekStart}
						onChange={handleSeekChange}
						onMouseUp={handleSeekEnd}
						onTouchEnd={handleSeekEnd}
						style={{
							background: `linear-gradient(to right, var(--cc-primary-color-focus) ${
								progress * 100
							}%, var(--cc-black-80) ${progress * 100}%)`,
						}}
					/>
				</div>

				<div className={classes.duration}>
					<time>{formatTime}</time>
				</div>

				<div className={classes.volumeControl}>
					<button
						className={classes.muteButton}
						onClick={onMuteToggle}
						aria-label={muted ? unmuteAudioLabel : muteAudioLabel}
						data-testid="mute-button"
					>
						{muted || volume === 0 ? <VolumeXIcon /> : <VolumeIcon />}
					</button>
					<div className={classes.volumeSlider}>
						<input
							type="range"
							min={0}
							max={1}
							step={0.01}
							value={effectiveVolume}
							aria-label={volumeLabel}
							data-testid="volume-slider"
							onChange={handleVolumeChange}
							style={{
								background: `linear-gradient(to right, var(--cc-primary-color-focus) ${
									effectiveVolume * 100
								}%, var(--cc-black-80) ${effectiveVolume * 100}%)`,
							}}
						/>
					</div>
				</div>

				<div className={classes.menuContainer}>
					<button
						ref={menuButtonRef}
						className={classnames(classes.menuButton, {
							[classes.menuButtonActive]: menuOpen,
						})}
						onClick={toggleMenu}
						aria-label="More options"
						aria-expanded={menuOpen}
						aria-haspopup="menu"
					>
						<EllipsisVerticalIcon />
					</button>

					{menuOpen && (
						<div ref={menuRef} className={classes.optionsMenu} role="menu">
							{menuView === "main" ? (
								<>
									{altText && (
										<button
											className={classes.menuItem}
											role="menuitem"
											onClick={handleDownloadTranscript}
										>
											<DownloadIcon />
											<span>Download</span>
										</button>
									)}
									<button
										className={classes.menuItem}
										role="menuitem"
										onClick={() => setMenuView("speed")}
									>
										<CirclePlayIcon />
										<span>Playback speed</span>
									</button>
								</>
							) : (
								<>
									<button
										className={classes.menuBackButton}
										onClick={() => setMenuView("main")}
									>
										← Playback speed
									</button>
									{PLAYBACK_SPEEDS.map(speed => (
										<button
											key={speed}
											className={classnames(classes.menuItem, {
												[classes.menuItemActive]: playbackRate === speed,
											})}
											role="menuitemradio"
											aria-checked={playbackRate === speed}
											onClick={() => {
												onPlaybackRateChange(speed);
												setMenuOpen(false);
												setMenuView("main");
											}}
										>
											{speed === 1 ? "Normal" : `${speed}×`}
										</button>
									))}
								</>
							)}
						</div>
					)}
				</div>
			</div>

			{altText && (
				<a
					ref={downloadTranscriptLinkRef}
					href={`data:text/plain;charset=utf-8,${encodeURIComponent(altText)}`}
					download="audio-transcript.txt"
					style={{ display: "none" }}
					aria-hidden="true"
				/>
			)}
		</div>
	);
};

export default Controls;
