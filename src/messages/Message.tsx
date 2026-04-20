import { FC, ReactNode, useMemo, useState, useEffect } from "react";

import { match, MessagePlugin } from "../matcher";
import { MessageProvider } from "./context";
import {
	C26Label,
	IStreamingMessage,
	IWebchatConfig,
	IWebchatTheme,
	MessageLayout,
	MessageSender,
} from "./types";

import "src/theme.css";
import { CollateMessage, isEventMessage } from "../utils";
import { IMessage } from "@cognigy/socket-client";
import { useCollation } from "./hooks";
import WebchatLayout from "./layouts/WebchatLayout";
import C26Layout from "./layouts/C26Layout";

export interface BaseMessageProps {
	action?: MessageSender;
	className?: string;
	config?: IWebchatConfig;
	disableHeader?: boolean;
	hasReply?: boolean;
	isConversationEnded?: boolean;
	isFullscreen?: boolean;
	message: IMessage & { id?: string; animationState?: "start" | "animating" | "done" | "exited" };
	onDismissFullscreen?: () => void;
	onEmitAnalytics?: (event: string, payload?: unknown) => void;
	onSendMessage?: MessageSender;
	onSetFullscreen?: () => void;
	openXAppOverlay?: (url: string | undefined) => void;
	plugins?: MessagePlugin[];
	prevMessage?: IMessage;
	theme?: IWebchatTheme;
	attributes?: React.HTMLProps<HTMLDivElement> & { styles?: React.CSSProperties };
	onSetMessageAnimated?: (
		messageId: string,
		animationState: IStreamingMessage["animationState"],
	) => void;
	onSetLiveRegionText?: (id: string, text: string) => void;
	"data-message-id"?: string;
}

export type MessageProps =
	| (BaseMessageProps & { layout?: "webchat"; label?: never; avatar?: never })
	| (BaseMessageProps & {
			layout: "c26";
			label?: C26Label;
			avatar?: ReactNode;
	  });

const defaultCollate = new CollateMessage();

const Message: FC<MessageProps> = props => {
	const {
		action,
		className,
		config,
		hasReply,
		isConversationEnded,
		isFullscreen,
		message,
		onDismissFullscreen,
		onEmitAnalytics,
		onSetFullscreen,
		openXAppOverlay,
		onSetMessageAnimated,
		onSetLiveRegionText,
		plugins,
		prevMessage,
		"data-message-id": dataMessageId,
	} = props;

	const collate = useCollation();

	const shouldCollate = collate
		? collate.isMessageCollatable(message, config, plugins, prevMessage)
		: defaultCollate.isMessageCollatable(message, config, plugins, prevMessage);

	const showHeader = !shouldCollate && !isFullscreen && !isEventMessage(message);

	const [headerInfo, setHeaderInfo] = useState<string | null>("");

	useEffect(() => {
		if (!showHeader) {
			setHeaderInfo(null);
		}
	}, [showHeader]);

	const matchedPlugins = match(message, config, plugins);

	const messageParams = useMemo(
		() => ({ hasReply, isConversationEnded }),
		[hasReply, isConversationEnded],
	);

	if (!Array.isArray(matchedPlugins) || matchedPlugins.length < 1) {
		return null;
	}

	if (isFullscreen) {
		const Fullscreen = matchedPlugins[0]?.component;
		if (Fullscreen) {
			return (
				<Fullscreen
					isFullscreen={isFullscreen}
					message={message}
					onDismissFullscreen={onDismissFullscreen}
					onEmitAnalytics={onEmitAnalytics}
					onSendMessage={action}
					onSetFullscreen={onSetFullscreen}
					prevMessage={prevMessage}
					theme={props.theme}
					attributes={{ styles: { flexGrow: 1, minHeight: 0 } }}
					onSetMessageAnimated={props.onSetMessageAnimated}
				/>
			);
		}
	}

	const layout: MessageLayout = props.layout ?? "webchat";

	const inner =
		layout === "webchat" ? (
			<WebchatLayout
				action={action}
				className={className}
				matchedPlugins={matchedPlugins}
				message={message}
				prevMessage={prevMessage}
				shouldCollate={shouldCollate}
				showHeader={showHeader}
				isFullscreen={isFullscreen}
				onDismissFullscreen={onDismissFullscreen}
				onEmitAnalytics={onEmitAnalytics}
				onSetFullscreen={onSetFullscreen}
				onSetMessageAnimated={onSetMessageAnimated}
				theme={props.theme}
				data-message-id={dataMessageId}
			/>
		) : (
			<C26Layout
				action={action}
				className={className}
				matchedPlugins={matchedPlugins}
				message={message}
				prevMessage={prevMessage}
				isFullscreen={isFullscreen}
				label={props.layout === "c26" ? props.label : undefined}
				avatar={props.layout === "c26" ? props.avatar : undefined}
				onDismissFullscreen={onDismissFullscreen}
				onEmitAnalytics={onEmitAnalytics}
				onSetFullscreen={onSetFullscreen}
				onSetMessageAnimated={onSetMessageAnimated}
				theme={props.theme}
				data-message-id={dataMessageId}
			/>
		);

	return (
		<MessageProvider
			action={action}
			config={config}
			message={message}
			messageParams={messageParams}
			onEmitAnalytics={onEmitAnalytics}
			openXAppOverlay={openXAppOverlay}
			data-message-id={dataMessageId}
			onSetLiveRegionText={onSetLiveRegionText}
			headerInfo={headerInfo}
			onSetHeaderInfo={setHeaderInfo}
		>
			{inner}
		</MessageProvider>
	);
};

export default Message;
