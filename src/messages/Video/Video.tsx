import { FC, useCallback, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import classes from "./Video.module.css";
import classnames from "classnames";
import PrimaryButton from "src/common/Buttons/PrimaryButton";
import { DownloadIcon, VideoPlayIcon } from "src/assets/svg";
import { useMessageContext } from "src/messages/hooks";
import { getChannelPayload } from "src/utils";
import { IWebchatVideoAttachment } from "@cognigy/socket-client";

const Video: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { url, altText, captionsUrl } =
		(payload?.message?.attachment as IWebchatVideoAttachment)?.payload || {};

	const downloadTranscriptLinkRef = useRef<HTMLAnchorElement>(null);
	const [playing, setPlaying] = useState(false);

	const videoPlayerWrapperRef = useRef<HTMLDivElement>(null);
	const videoPlayerRef = useRef<ReactPlayer>(null);

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

	// Play/Pause video on Enter/Space key press
	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			event.stopPropagation();
			setPlaying(!playing);
		}
	};

	// lightMode is true when the video has not started playing
	const lightMode = useMemo(() => {
		if (playing) {
			return false;
		} else {
			return (
				videoPlayerRef.current?.getCurrentTime() === 0 ||
				videoPlayerRef.current?.getCurrentTime() === undefined
			);
		}
	}, [playing]);

	const videoCaptionsConfig = {
		attributes: {
			crossOrigin: "true",
		},
		tracks: [
			{
				kind: "subtitles",
				src: captionsUrl as string,
				srcLang: "en-US", // TODO: Get language from Say node in the future
				label: "On",
			},
		],
	};

	if (!url) return null;

	return (
		// Latest version of ReactPlayer at the moment supports previewTabIndex and previewArialLabel props for passing tabindex and aria-label to the video preview button (light mode),
		// But, does not support passing a role prop to the preview button.
		// Therefore, we need to add the role, tabindex and aria-label attributes to the video preview wrapper div and handle the keydown event to play/pause the video.
		<div className={classnames(classes.wrapper, altText && classes.wrapperWithButton)}>
			<div
				className={classnames(classes.playerWrapper, "webchat-media-template-video")}
				ref={videoPlayerWrapperRef}
				data-testid="video-message"
				role={lightMode ? "button" : undefined}
				tabIndex={lightMode ? 0 : -1}
				aria-label={lightMode ? "Play Video" : undefined}
				onKeyDown={handleKeyDown}
			>
				<ReactPlayer
					ref={videoPlayerRef}
					url={url}
					light={lightMode}
					playing={playing}
					controls
					className={classes.player}
					playIcon={<VideoPlayIcon width="35px" height="35px" />}
					width="unset"
					height="unset"
					onPlay={() => setPlaying(true)}
					onPause={() => setPlaying(false)}
					onClickPreview={() => setPlaying(!playing)}
					onReady={handleFocus}
					onStart={handleOnStart}
					previewTabIndex={-1} // Remove tabindex from the video preview, as it is handled by the wrapper div
					config={{ file: captionsUrl ? videoCaptionsConfig : {} }}
				/>
			</div>
			{altText && (
				<div className={classes.downloadButtonWrapper}>
					<PrimaryButton
						className={classnames(
							classes.downloadButton,
							"webchat-buttons-template-button-video",
						)}
						customIcon={<DownloadIcon className={classes.downloadIcon} fontSize={10} />}
						onClick={() => downloadTranscriptLinkRef.current?.click()}
					>
						Download Transcript
					</PrimaryButton>
					<a
						ref={downloadTranscriptLinkRef}
						href={`data:text/plain;charset=utf-8,${encodeURIComponent(altText)}`}
						download="video-transcript.txt"
						style={{ display: "none" }}
						aria-hidden="true"
					/>
				</div>
			)}
		</div>
	);
};

export default Video;
