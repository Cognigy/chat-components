// import type { IOutput } from "@cognigy/socket-client";

import { MessageProps } from "src/messages/Message";

export type MessagePasstroughProps = Pick<MessageProps, "message" | "action">;

export type TSourceDirection = "incoming" | "outgoing";
export type TSourceColor = "bot" | "user";

export interface IWebchatSettings {
	// Settings that are also configurable via the Endpoint Editor in Cognigy.AI
	layout: {
		title: string;
		logoUrl: string;
		useOtherAgentLogo: boolean;
		botAvatarName: string;
		botLogoUrl: string;
		agentAvatarName: string;
		agentLogoUrl: string;
		inputAutogrowMaxRows: number;
		enableInputCollation: boolean;
		inputCollationTimeout: number;
		dynamicImageAspectRatio: boolean;
		disableInputAutocomplete: boolean;
		enableGenericHTMLStyling: boolean;
		disableHtmlContentSanitization: boolean;
		disableUrlButtonSanitization: boolean;
		watermark: "default" | "custom" | "none";
		watermarkText: string;
		disableBotOutputBorder: boolean;
		botOutputMaxWidthPercentage: number;
		chatWindowWidth: number;
	};
	colors: {
		primaryColor: string;
		secondaryColor: string;
		chatInterfaceColor: string;
		botMessageColor: string;
		userMessageColor: string;
		textLinkColor: string;
	};
	behavior: {
		progressiveMessageRendering: boolean;
		enableAIAgentNotice: boolean;
		AIAgentNoticeText: string;
		enableTypingIndicator: boolean;
		messageDelay: number;
		inputPlaceholder: string;
		enableSTT: boolean;
		enableTTS: boolean;
		focusInputAfterPostback: boolean;
		enableConnectionStatusIndicator: boolean;
		renderMarkdown: boolean;
	};
	startBehavior: {
		startBehavior: "none" | "button" | "injection";
		getStartedPayload: string;
		getStartedData: object;
		getStartedText: string;
		getStartedButtonText: string;
	};
	fileStorageSettings?: {
		enabled?: boolean;
		dropzoneText?: string;
	};
	businessHours: {
		enabled: boolean;
		mode: "inform" | "hide" | "disable";
		text: string;
		title: string;
		timeZone: string;
		times: {
			startTime: string;
			endTime: string;
			weekDay: string;
		}[];
	};
	unreadMessages: {
		enableIndicator: boolean;
		enableBadge: boolean;
		enablePreview: boolean;
		enableSound: boolean;
		unreadMessageTitleText: string;
		unreadMessageTitleTextPlural: string;
	};
	homeScreen: {
		enabled: boolean;
		welcomeText: string;
		background: {
			imageUrl: string;
			color: string;
		};
		startConversationButtonText: string;
		previousConversations: {
			enabled: boolean;
			buttonText: string;
			title: string;
		};
		conversationStarters: {
			enabled: boolean;
			starters: {
				type: "postback" | "web_url" | "phone_number";
				title: string;
				url?: string;
				payload?: string;
			}[];
		};
	};
	teaserMessage: {
		text: string;
		teaserMessageDelay: number;
		showInChat: boolean;
		conversationStarters: {
			enabled: boolean;
			starters: {
				type: "postback" | "web_url" | "phone_number";
				title: string;
				url?: string;
				payload?: string;
			}[];
		};
	};
	chatOptions: {
		enabled: boolean;
		title: string;
		quickReplyOptions: {
			enabled: boolean;
			sectionTitle: string;
			quickReplies: {
				type: "postback" | "web_url" | "phone_number";
				title: string;
				url?: string;
				payload?: string;
			}[];
		};
		showTTSToggle: boolean;
		activateTTSToggle: boolean;
		labelTTSToggle: string;
		rating: {
			enabled: "no" | "once" | "always";
			title: string;
			commentPlaceholder: string;
			submitButtonText: string;
			eventBannerText: string;
		};
		footer: {
			enabled: boolean;
			items: {
				title: string;
				url: string;
			}[];
		};
	};
	privacyNotice: {
		enabled: boolean;
		title: string;
		text: string;
		submitButtonText: string;
		urlText: string;
		url: string;
	};
	fileAttachmentMaxSize: number;
	maintenance: {
		enabled: boolean;
		mode: "inform" | "hide" | "disable";
		text: string;
		title: string;
	};
	demoWebchat: {
		enabled: boolean;
		backgroundImageUrl: string;
		position: "centered" | "bottomRight";
	};

	// Settings related to the webchat browser embedding
	// These settings are NOT configurable via the Endpoint Editor in Cognigy.AI
	embeddingConfiguration: {
		_endpointTokenUrl: string;
		awaitEndpointConfig: boolean;
		disableLocalStorage: boolean;
		disablePersistentHistory: boolean;
		useSessionStorage: boolean;
		connectivity: {
			enabled: boolean;
			mode: string;
			text: string;
			timeout: number;
			title: string;
		};
	};

	// Additional Settings to configure the webchat widget behavior
	// These settings are NOT configurable via the Endpoint Editor in Cognigy.AI
	widgetSettings: {
		disableDefaultReplyCompatiblityMode: boolean;
		enableStrictMessengerSync: boolean;

		disableHtmlInput: boolean;
		disableInputAutofocus: boolean;
		disableRenderURLsAsLinks: boolean;
		disableTextInputSanitization: boolean;
		disableToggleButton: boolean;
		enableAutoFocus: boolean;
		enableInjectionWithoutEmptyHistory: boolean;
		enableFocusTrap: boolean;
		enableDefaultPreview: boolean;
		ignoreLineBreaks: boolean;
		STTLanguage: string;

		sourceDirectionMapping: {
			agent: TSourceDirection;
			bot: TSourceDirection;
			user: TSourceDirection;
		};
		sourceColorMapping: {
			agent: TSourceColor;
			bot: TSourceColor;
			user: TSourceColor;
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
