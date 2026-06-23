import {
	ChangeEvent,
	FC,
	KeyboardEvent,
	MutableRefObject,
	useRef,
	useMemo,
	useState,
	useEffect,
	useCallback,
	useId,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import classes from "./Audio.module.css";
import {
	DownloadIcon,
	VolumeIcon,
	VolumeXIcon,
	EllipsisVerticalIcon,
	CirclePlayIcon,
	PlayIcon,
	PauseIcon,
	ArrowBack,
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
	const [speedAnnouncement, setSpeedAnnouncement] = useState("");
	const { config } = useMessageContext();

	// Focus the relevant item for the current view (APG menu button pattern).
	// preventScroll avoids the browser scrolling the item into view — that scroll
	// would trip the scroll-to-close listener and dismiss the menu the instant it
	// opens when the trigger sits near a scroll boundary (e.g. under the IP tabs).
	const focusActiveView = useCallback(
		(cameFromSpeed = false) => {
			if (menuView === "speed") {
				// Focus the currently checked speed so the user immediately hears the active selection
				const checkedItem = menuRef.current?.querySelector<HTMLElement>(
					'[role="menuitemradio"][aria-checked="true"]',
				);
				const firstSpeed =
					menuRef.current?.querySelector<HTMLElement>('[role="menuitemradio"]');
				(checkedItem ?? firstSpeed)?.focus({ preventScroll: true });
			} else if (cameFromSpeed) {
				// Returning from the speed submenu: APG says focus the parent menuitem we
				// came from (the one with aria-haspopup), not the first item.
				const parentItem = menuRef.current?.querySelector<HTMLElement>(
					'[role="menuitem"][aria-haspopup="menu"]',
				);
				parentItem?.focus({ preventScroll: true });
			} else {
				const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
				firstItem?.focus({ preventScroll: true });
			}
		},
		[menuView],
	);

	// Re-focus when switching between main and speed views while the menu is open.
	// Guarded on an actual view change (not the open transition) so the initial
	// open focus stays owned by Radix's onOpenAutoFocus and we don't race its
	// focus scope. Tracking the previous view lets us list every dependency.
	const prevMenuViewRef = useRef(menuView);
	useEffect(() => {
		if (menuOpen && prevMenuViewRef.current !== menuView) {
			focusActiveView(prevMenuViewRef.current === "speed");
		}
		prevMenuViewRef.current = menuView;
	}, [menuOpen, menuView, focusActiveView]);

	// Close the menu on any scroll — simpler and steadier than repositioning a
	// fixed popover against a moving anchor. Capture phase catches scrolls on any
	// ancestor scroll container, not just the window.
	//
	// Arming is deferred by one animation frame: opening the menu when the trigger
	// is partially clipped by a scroll container (e.g. under the IP tabs) makes the
	// browser auto-scroll to reveal the trigger, and that scroll dispatches right
	// after this listener attaches. Without the guard it would dismiss the menu the
	// instant it opens. The auto-scroll fires before the rAF callback, so it's
	// ignored; genuine user scrolls afterwards still close the menu.
	useEffect(() => {
		if (!menuOpen) return;
		let armed = false;
		const raf = requestAnimationFrame(() => {
			armed = true;
		});
		const close = () => {
			if (!armed) return;
			setMenuOpen(false);
			setMenuView("main");
		};
		window.addEventListener("scroll", close, { capture: true, passive: true });
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", close, { capture: true });
		};
	}, [menuOpen]);

	const getMenuItems = useCallback((): HTMLElement[] => {
		if (!menuRef.current) return [];
		return Array.from(
			menuRef.current.querySelectorAll<HTMLElement>(
				"[role='menuitem'], [role='menuitemradio']",
			),
		);
	}, []);

	const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		const items = getMenuItems();
		const currentIndex = items.indexOf(document.activeElement as HTMLElement);

		switch (e.key) {
			// Escape is handled by Popover.Content's onEscapeKeyDown so we can
			// intercept Radix's default dismiss for the two-level submenu behavior.
			case "Tab":
				// Close menu; let browser advance focus naturally to next element
				setMenuOpen(false);
				setMenuView("main");
				break;
			case "ArrowDown":
				e.preventDefault();
				if (items.length > 0)
					items[(currentIndex + 1) % items.length]?.focus({ preventScroll: true });
				break;
			case "ArrowUp":
				e.preventDefault();
				if (items.length > 0)
					items[(currentIndex - 1 + items.length) % items.length]?.focus({
						preventScroll: true,
					});
				break;
			case "Home":
				e.preventDefault();
				items[0]?.focus({ preventScroll: true });
				break;
			case "End":
				e.preventDefault();
				items[items.length - 1]?.focus({ preventScroll: true });
				break;
			case "ArrowRight":
				// APG: Right Arrow on a parent menuitem opens its submenu and moves
				// focus to the first submenu item. Only the Playback speed item has a
				// submenu (aria-haspopup); the view-change effect handles the focus move.
				if (
					menuView === "main" &&
					(document.activeElement as HTMLElement)?.getAttribute("aria-haspopup") ===
						"menu"
				) {
					e.preventDefault();
					setMenuView("speed");
				}
				break;
			case "ArrowLeft":
				if (menuView === "speed") {
					e.preventDefault();
					setMenuView("main");
				}
				break;
		}
	};

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
		menuButtonRef.current?.focus({ preventScroll: true });
	};

	const handleOpenChange = (open: boolean) => {
		setMenuOpen(open);
		if (!open) setMenuView("main");
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
	const moreOptionsLabel =
		config?.settings?.customTranslations?.ariaLabels?.audioMoreOptions || "More options";
	const playbackSpeedLabel =
		config?.settings?.customTranslations?.ariaLabels?.audioPlaybackSpeed || "Playback speed";
	const normalSpeedLabel =
		config?.settings?.customTranslations?.ariaLabels?.audioNormalSpeed || "Normal";
	const downloadTranscriptLabel =
		config?.settings?.customTranslations?.ariaLabels?.downloadTranscript ||
		"Download transcript";

	// Unique id so the visible "Playback speed" title can name the speed submenu via
	// aria-labelledby without colliding when multiple audio messages share a page.
	const speedHeadingId = useId();

	const effectiveVolume = muted ? 0 : volume;

	return (
		<div className={classes.audioWrapper} data-testid="audio-controls">
			<div className={classes.controls}>
				<button
					className={classes.playButton}
					onClick={togglePlayAndPause}
					aria-label={playing ? pauseAudioLabel : playAudioLabel}
					data-testid="play-pause-button"
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
							}%, var(--cc-audio-slider-track, var(--cc-primary-color-opacity-10)) ${
								progress * 100
							}%)`,
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
							aria-valuetext={`${volumeLabel} ${Math.round(effectiveVolume * 100)}%`}
							data-testid="volume-slider"
							onChange={handleVolumeChange}
							style={{
								background: `linear-gradient(to right, var(--cc-primary-color-focus) ${
									effectiveVolume * 100
								}%, var(--cc-audio-slider-track, var(--cc-primary-color-opacity-10)) ${
									effectiveVolume * 100
								}%)`,
							}}
						/>
					</div>
				</div>

				<Popover.Root open={menuOpen} onOpenChange={handleOpenChange}>
					<div className={classes.menuContainer}>
						<Popover.Trigger asChild>
							<button
								ref={menuButtonRef}
								className={classnames(classes.menuButton, {
									[classes.menuButtonActive]: menuOpen,
								})}
								aria-label={moreOptionsLabel}
								aria-haspopup="menu"
							>
								<EllipsisVerticalIcon />
							</button>
						</Popover.Trigger>

						<Popover.Content
							ref={menuRef}
							className={classes.optionsMenu}
							role="menu"
							side="bottom"
							align="end"
							sideOffset={6}
							collisionPadding={8}
							onKeyDown={handleMenuKeyDown}
							onEscapeKeyDown={e => {
								// APG: Escape closes the innermost menu. In the speed submenu,
								// prevent Radix's full dismiss and step back to the main view
								// (the view-change effect re-focuses the Playback speed parent).
								// In the main view, let Radix dismiss but explicitly restore
								// focus — Radix's FocusScope return is unreliable in some
								// environments (e.g. jsdom).
								if (menuView === "speed") {
									e.preventDefault();
									setMenuView("main");
								} else {
									menuButtonRef.current?.focus({ preventScroll: true });
								}
							}}
							onOpenAutoFocus={e => {
								e.preventDefault();
								focusActiveView();
							}}
						>
							{menuView === "main" ? (
								<>
									{altText && (
										<button
											className={classes.menuItem}
											role="menuitem"
											tabIndex={-1}
											onClick={handleDownloadTranscript}
										>
											<DownloadIcon />
											<span>{downloadTranscriptLabel}</span>
										</button>
									)}
									<button
										className={classes.menuItem}
										role="menuitem"
										tabIndex={-1}
										// Parent menuitem of the speed submenu (APG menu pattern):
										// haspopup conveys the submenu relationship so AT enters
										// the submenu in focus mode. This view-switching popover
										// only renders this item in the main view (submenu hidden),
										// so aria-expanded is false whenever it's present.
										aria-haspopup="menu"
										aria-expanded={false}
										onClick={() => setMenuView("speed")}
									>
										<CirclePlayIcon />
										<span>{playbackSpeedLabel}</span>
									</button>
								</>
							) : (
								<>
									<div className={classes.menuViewHeader}>
										{/*
										 * Pointer-only back affordance. The APG menu pattern has
										 * no focusable back item — keyboard/AT users go back via
										 * ArrowLeft or Escape (see handleMenuKeyDown). Exposing it
										 * to AT made it either a counted "1 of 1" menuitem or a
										 * roleless control that dropped NVDA out of focus mode
										 * (arrows stopped moving focus). So the icon button is
										 * aria-hidden + tabIndex=-1: clickable for mouse/touch,
										 * invisible to AT and the keyboard. The title beside it
										 * stays exposed and names the submenu (aria-labelledby).
										 */}
										<button
											className={classes.menuBackButton}
											type="button"
											tabIndex={-1}
											aria-hidden="true"
											onClick={() => setMenuView("main")}
										>
											<ArrowBack />
										</button>
										<span id={speedHeadingId} className={classes.menuViewTitle}>
											{playbackSpeedLabel}
										</span>
									</div>
									<div role="menu" aria-labelledby={speedHeadingId}>
										{PLAYBACK_SPEEDS.map(speed => (
											<button
												key={speed}
												className={classnames(classes.menuItem, {
													[classes.menuItemActive]:
														playbackRate === speed,
												})}
												role="menuitemradio"
												tabIndex={-1}
												aria-checked={playbackRate === speed}
												aria-label={
													speed === 1
														? `${normalSpeedLabel} speed`
														: `${speed} times speed`
												}
												onClick={() => {
													onPlaybackRateChange(speed);
													const label =
														speed === 1
															? `${normalSpeedLabel} speed`
															: `${speed} times speed`;
													setSpeedAnnouncement(
														`${playbackSpeedLabel}: ${label}`,
													);
													setMenuOpen(false);
													setMenuView("main");
													menuButtonRef.current?.focus({
														preventScroll: true,
													});
												}}
											>
												{speed === 1 ? normalSpeedLabel : `${speed}×`}
											</button>
										))}
									</div>
								</>
							)}
						</Popover.Content>
					</div>
				</Popover.Root>
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

			<div
				aria-live="polite"
				aria-atomic="true"
				style={{
					position: "absolute",
					width: "1px",
					height: "1px",
					padding: 0,
					margin: "-1px",
					overflow: "hidden",
					clip: "rect(0,0,0,0)",
					whiteSpace: "nowrap",
					border: 0,
				}}
			>
				{speedAnnouncement}
			</div>
		</div>
	);
};

export default Controls;
