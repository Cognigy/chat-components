// import type { IOutput } from "@cognigy/socket-client";

import { MessageProps } from "src/messages/Message";

export type MessagePasstroughProps = Pick<MessageProps, "message" | "action">;

export type TSourceDirection = "incoming" | "outgoing";

/**
 * The subset of the Webchat settings that the message renderers in this library
 * read. Every key is optional: consumers pass their own, fuller settings object
 * (Webchat's `IWebchatSettings` in `src/common/interfaces/webchat-config.ts` is
 * the canonical definition of the whole surface) and TypeScript's structural
 * typing accepts it as long as the keys declared here have compatible types.
 *
 * This is deliberately NOT a mirror of Webchat's interface. When a renderer starts
 * reading a new setting, add the key here with its fallback documented at the
 * read site, then expose it in Webchat's interface and `docs/embedding.md`.
 */
export interface IWebchatSettings {
	layout?: {
		/** Disables DOMPurify sanitization of message HTML. */
		disableHtmlContentSanitization?: boolean;
		/** Disables sanitization of URL button targets. */
		disableUrlButtonSanitization?: boolean;
		dynamicImageAspectRatio?: boolean;
		disableBotOutputBorder?: boolean;
		botOutputMaxWidthPercentage?: number;
		/** Renders a gallery card's title beneath the image instead of overlaying it. */
		galleryCardTitleBelowImage?: boolean;
	};
	behavior?: {
		collateStreamedOutputs?: boolean;
		progressiveMessageRendering?: boolean;
		renderMarkdown?: boolean;
		focusInputAfterPostback?: boolean;
	};
	teaserMessage?: {
		showInChat?: boolean;
	};
	widgetSettings?: {
		/** Replaces the sanitizer's default tag allow-list entirely; only these tags
		 *  survive sanitization (`sanitizeHTMLWithConfig` in `src/sanitize.ts`). */
		customAllowedHtmlTags?: string[];
		disableRenderURLsAsLinks?: boolean;
		disableTextInputSanitization?: boolean;
		enableAutoFocus?: boolean;
		enableDefaultPreview?: boolean;
		enableStrictMessengerSync?: boolean;
		sourceDirectionMapping?: {
			agent?: TSourceDirection;
			bot?: TSourceDirection;
			user?: TSourceDirection;
		};
	};
	customTranslations?: {
		datePickerMonthLabel?: string;
		datePickerYearLabel?: string;
		/** Accessible names used by the renderers; each read site has an English fallback. */
		ariaLabels?: {
			// Links and buttons
			opensInNewTab?: string;
			actionButtonPositionText?: string;
			buttonGroupLabel?: string;
			// Gallery / list live-region text
			slidesCountText?: string;
			slide?: string;
			listItemGroupLabel?: string;
			// Audio player
			audioPlaybackProgress?: string;
			audioTimeRemaining?: string;
			pauseAudio?: string;
			playAudio?: string;
			muteAudio?: string;
			unmuteAudio?: string;
			audioVolume?: string;
			audioMoreOptions?: string;
			audioPlaybackSpeed?: string;
			audioNormalSpeed?: string;
			downloadTranscript?: string;
			// Video player
			playVideo?: string;
			// Image lightbox
			viewImageInFullsize?: string;
			fullSizeImageViewerTitle?: string;
			downloadFullsizeImage?: string;
			closeFullsizeImageModal?: string;
			// Date picker
			closeDatePicker?: string;
			datePickerPreviousMonth?: string;
			datePickerNextMonth?: string;
			datePickerGridLabel?: string;
			datePickerGridDescription?: string;
			datePickerRangeStart?: string;
			datePickerRangeEnd?: string;
			datePickerWeekNumber?: string;
			datePickerAmPm?: string;
			datePickerHour?: string;
			datePickerMinute?: string;
			// Live-region announcements per content type
			imageContent?: {
				downloadable?: string;
				nonDownloadable?: string;
			};
			videoContent?: {
				withTranscriptAndCaptions?: string;
				withTranscript?: string;
				withCaptions?: string;
				withoutTranscriptAndCaptions?: string;
			};
			audioContent?: {
				withTranscript?: string;
				withoutTranscript?: string;
			};
			fileContent?: {
				singleFile?: string;
				multipleFiles?: string;
			};
			messageHeader?: {
				user?: string;
				bot?: string;
				timestamp?: string;
			};
		};
	};
}

export interface IWebchatConfig {
	active: boolean;
	URLToken: string;
	initialSessionId: string;
	settings: IWebchatSettings;
	isConfigLoaded: boolean;
	isTimedOut: boolean;
}

export interface ISendMessageOptions {
	/** overrides the displayed text within a chat bubble. useful for e.g. buttons */
	label: string;

	/** marks this message as "collatable", delaying its submission for the enableInputCollation functionality */
	collate: boolean;
}

type TMessage = MessageProps["message"];

export interface IStreamingMessage extends TMessage {
	animationState?: "start" | "animating" | "done" | "exited";
	finishReason?: string;
}

export interface StreamingTextState {
	isComplete: boolean;
	displayedText: string;
}

export interface MessageState {
	id: number;
	text: string;
	isComplete: boolean;
	displayedText: string;
}

// TODO: move this one SocketClient repo or reuse an existing interface (IProcessOutputData?)
export type MessageSender = (
	text?: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: Record<string, any> | null,
	options?: Partial<ISendMessageOptions>,
) => void;

export interface IWebchatTheme {
	// Webchat V3 theme colors
	// Primary Colors
	primaryColor: string;
	primaryColorHover: string;
	primaryColorDisabled: string;
	primaryContrastColor: string;
	primaryColorFocus: string;

	// Secondary Colors
	secondaryColor: string;
	secondaryColorHover: string;
	secondaryColorDisabled: string;
	secondaryContrastColor: string;

	// Meta Colors
	backgroundHome: string;
	backgroundWebchat: string;
	backgroundBotMessage: string;
	backgroundUserMessage: string;
	backgroundEngagementMessage: string;

	textLink: string;
	textLinkHover: string;
	textLinkDisabled: string;

	//Basic Colors
	black10: string;
	black20: string;
	black40: string;
	black60: string;
	black80: string;
	black95: string;
	white: string;

	textDark: string;
	textLight: string;

	// Confirmation Colors
	green: string;
	green10: string;
	red: string;
	red10: string;

	// Legacy Webchat V2 theme colors
	primaryStrongColor: string;
	primaryWeakColor: string;
	primaryGradient: string;
	primaryStrongGradient: string;

	greyColor: string;
	greyStrongColor: string;
	greyWeakColor: string;
	greyContrastColor: string;

	shadow: string;
	messageShadow: string;

	unitSize: number;
	blockSize: number;
	cornerSize: number;

	fontFamily: string;
}
