// import type { IOutput } from "@cognigy/socket-client";

import { MessageProps } from "src/messages/Message";

export type MessagePasstroughProps = Pick<MessageProps, "message" | "action">;

export interface IPersistentMenuItem {
	title: string;
	payload: string;
}

export type TSourceDirection = "incoming" | "outgoing";
export type TSourceColor = "primary" | "neutral";

export interface IWebchatSettings {
	awaitEndpointConfig: boolean;
	agentAvatarUrl: string;
	backgroundImageUrl: string;
	businessHours: {
		businessHours: IBusinessHours[];
		enabled: boolean;
		mode: string;
		text: string;
		timeZone: string;
		title: string;
	};
	colorScheme: string;
	connectivity: {
		enabled: boolean;
		mode: string;
		text: string;
		timeout: number;
		title: string;
	};
	designTemplate: number;
	disableBranding: boolean;
	disableDefaultReplyCompatiblityMode: boolean;
	disableHtmlContentSanitization: boolean;
	disableHtmlInput: boolean;
	disableInputAutocomplete: boolean;
	disableInputAutofocus: boolean;
	disableInputAutogrow: boolean;
	disableLocalStorage: boolean;
	disablePersistentHistory: boolean;
	disableRenderURLsAsLinks: boolean;
	disableTextInputSanitization: boolean;
	disableToggleButton: boolean;
	disableUrlButtonSanitization: boolean;
	dynamicImageAspectRatio: boolean;
	enableAutoFocus: boolean;
	enableConnectionStatusIndicator: boolean;
	enableFileUpload: boolean;
	enableFocusTrap: boolean;
	enableGenericHTMLStyling: boolean;
	enableInjectionWithoutEmptyHistory: boolean;
	enableInputCollation: boolean;
	enablePersistentMenu: boolean;
	enableRating: "always" | "once" | "onRequest";
	enableStrictMessengerSync: boolean;
	enableSTT: boolean;
	enableTTS: boolean;
	enableTypingIndicator: boolean;
	enableUnreadMessageBadge: boolean;
	enableUnreadMessagePreview: boolean;
	enableUnreadMessageSound: boolean;
	enableUnreadMessageTitleIndicator: boolean;
	enableDefaultPreview: boolean;
	enableFileAttachment: boolean;
	fileAttachmentMaxSize: number;
	engagementMessageDelay: number;
	engagementMessageText: string;
	focusInputAfterPostback: boolean;
	getStartedButtonText: string;
	getStartedData: object;
	getStartedPayload: string;
	getStartedText: string;
	headerLogoUrl: string;
	ignoreLineBreaks: boolean;
	inputAutogrowMaxRows: number;
	inputCollationTimeout: number;
	inputPlaceholder: string;
	maintenance: {
		enabled: boolean;
		mode: string;
		text: string;
		title: string;
	};
	messageDelay: number;
	/** TODO: this is the botAvatarUrl (rename for major) */
	messageLogoUrl: string;
	persistentMenu: {
		title: string;
		menuItems: IPersistentMenuItem[];
	};
	ratingCommentText: string;
	ratingMessageHistoryCommentText: string;
	ratingMessageHistoryRatingText: string;
	ratingTitleText: string;
	showEngagementMessagesInChat: boolean;
	startBehavior: "none" | "button" | "injection";
	STTLanguage: string;
	title: string;
	unreadMessageTitleText: string;
	unreadMessageTitleTextPlural: string;
	userAvatarUrl: string;
	useSessionStorage: boolean;
	sourceDirectionMapping: {
		agent: TSourceDirection;
		bot: TSourceDirection;
		engagement: TSourceDirection;
		user: TSourceDirection;
	};
	sourceColorMapping: {
		agent: TSourceColor;
		bot: TSourceColor;
		engagement: TSourceColor;
		user: TSourceColor;
	};
	_endpointTokenUrl: string;
}

export interface IWebchatConfig {
	active: boolean;
	URLToken: string;
	initialSessionId: string;
	settings: IWebchatSettings;
	isConfigLoaded: boolean;
	isTimedOut: boolean;
}

export interface IBusinessHours {
	startTime: string;
	endTime: string;
	weekDay: string;
}

export interface ISendMessageOptions {
	/** overrides the displayed text within a chat bubble. useful for e.g. buttons */
	label: string;

	/** marks this message as "collatable", delaying its submission for the enableInputCollation functionality */
	collate: boolean;
}

// TODO: move this one SocketClient repo or reuse an existing interface (IProcessOutputData?)
export type MessageSender = (
	text?: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: Record<string, any> | null,
	options?: Partial<ISendMessageOptions>,
) => void;
