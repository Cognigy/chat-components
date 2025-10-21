import React, {
	useEffect,
	useImperativeHandle,
	useRef,
	forwardRef,
	ReactNode,
	CSSProperties,
} from "react";

/**
 * Very lightweight mock of `react-player` sufficient for current test needs.
 *
 * It implements the subset of the API used in:
 *  - src/messages/Audio/Audio.tsx
 *  - src/messages/Audio/Controls.tsx
 *  - src/messages/Video/Video.tsx
 *
 * Features:
 *  - Renders (optionally hidden) <audio /> element for audio usage.
 *  - Renders a preview div (`.react-player__preview`) when `light` prop is truthy.
 *  - Calls lifecycle callbacks: onReady, onStart, onPlay, onPause.
 *  - Exposes imperative methods: seekTo, getInternalPlayer, getCurrentTime.
 *  - Emits simple progress events based on a timer when playing.
 *  - Supports toggling play state via preview click (calls `onClickPreview`).
 *
 * NOTE: This is NOT a full fidelity player; it only mimics interactions needed by tests.
 */

type OnProgressState = {
	played: number;
};

interface MockReactPlayerProps {
	url?: string;
	playing?: boolean;
	light?: boolean;
	controls?: boolean;
	className?: string;
	width?: string | number;
	height?: string | number;
	style?: CSSProperties;
	playIcon?: ReactNode;
	onReady?: (player: any) => void;
	onStart?: () => void;
	onPlay?: () => void;
	onPause?: () => void;
	onProgress?: (state: OnProgressState) => void;
	onDuration?: (duration: number) => void;
	onClickPreview?: () => void;
	progressInterval?: number; // seconds (original library uses ms granularity)
	previewTabIndex?: number;
	config?: any;
}

export interface MockReactPlayerHandle {
	seekTo: (fractionOrSeconds: number) => void;
	getInternalPlayer: () => {
		focus: () => void;
	};
	getCurrentTime: () => number;
}

const DEFAULT_DURATION_SECONDS = 10;

const ReactPlayer = forwardRef<MockReactPlayerHandle, MockReactPlayerProps>((props, ref) => {
	const {
		playing = false,
		light = false,
		className,
		style,
		playIcon,
		onReady,
		onStart,
		onPlay,
		onPause,
		onProgress,
		onDuration,
		onClickPreview,
		progressInterval = 0.5,
		previewTabIndex,
	} = props;

	const startedRef = useRef(false);
	const currentTimeRef = useRef(0);
	const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Imperative handle mimicking react-player API used by code.
	useImperativeHandle(
		ref,
		() => ({
			seekTo(value: number) {
				// Accept fraction (0..1) or seconds; heuristically decide
				if (value <= 1) {
					currentTimeRef.current = value * DEFAULT_DURATION_SECONDS;
				} else {
					currentTimeRef.current = value;
				}
				emitProgress();
			},
			getInternalPlayer() {
				return {
					focus: () => {
						// No-op focus simulation
					},
				};
			},
			getCurrentTime() {
				return currentTimeRef.current;
			},
		}),
		[],
	);

	// Helper to emit progress callback.
	const emitProgress = () => {
		if (onProgress) {
			const playedFraction = Math.min(1, currentTimeRef.current / DEFAULT_DURATION_SECONDS);
			onProgress({ played: playedFraction });
		}
	};

	// Simulate duration event once on mount.
	useEffect(() => {
		onDuration?.(DEFAULT_DURATION_SECONDS);
		// Call onReady once mounted with ref handle
		onReady?.({
			getInternalPlayer: () => ({
				focus: () => {},
			}),
		});
	}, []);

	// Start / stop progress timer based on playing state.
	useEffect(() => {
		if (playing) {
			onPlay?.();
			// Fire onStart only once
			if (!startedRef.current) {
				startedRef.current = true;
				onStart?.();
			}
			if (!progressTimerRef.current) {
				progressTimerRef.current = setInterval(() => {
					currentTimeRef.current += progressInterval;
					if (currentTimeRef.current > DEFAULT_DURATION_SECONDS) {
						currentTimeRef.current = DEFAULT_DURATION_SECONDS;
						clearInterval(progressTimerRef.current as NodeJS.Timeout);
						progressTimerRef.current = null;
					}
					emitProgress();
				}, progressInterval * 1000);
			}
		} else {
			onPause?.();
			if (progressTimerRef.current) {
				clearInterval(progressTimerRef.current);
				progressTimerRef.current = null;
			}
		}
		return () => {
			if (progressTimerRef.current) {
				clearInterval(progressTimerRef.current);
				progressTimerRef.current = null;
			}
		};
	}, [playing]);

	// Clicking preview should trigger provided onClickPreview.
	const handlePreviewClick = () => {
		onClickPreview?.();
	};

	/**
	 * Render:
	 *  - Wrapper div mimicking original library structure.
	 *  - Preview div (when light) with class .react-player__preview
	 *  - Hidden <audio /> or <video /> element (choose heuristic by file extension)
	 */
	const isVideo = props.url?.match(/\.(mp4|webm|ogg|mov)$/i);
	const mediaElement = isVideo ? (
		<video data-testid="mock-video-element" style={{ display: playing ? "block" : "none" }} />
	) : (
		<audio data-testid="mock-audio-element" style={style || { display: "none" }} />
	);

	return (
		<div className={className} style={style}>
			{light && (
				<div
					className="react-player__preview"
					onClick={handlePreviewClick}
					tabIndex={previewTabIndex ?? 0}
					aria-label="Preview"
					role="button"
				>
					{playIcon ?? <button type="button">Play</button>}
				</div>
			)}
			{mediaElement}
		</div>
	);
});

ReactPlayer.displayName = "MockReactPlayer";

export default ReactPlayer;
