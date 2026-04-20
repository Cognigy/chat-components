import { FC } from "react";
import classnames from "classnames";

import MessageHeader from "../../common/MessageHeader";
import { MessagePlugin } from "../../matcher";
import { IStreamingMessage, IWebchatTheme, MessageSender } from "../types";
import { IMessage } from "@cognigy/socket-client";

import classes from "./WebchatLayout.module.css";
import mainClasses from "src/main.module.css";

export interface WebchatLayoutProps {
	action?: MessageSender;
	className?: string;
	matchedPlugins: MessagePlugin[];
	message: IMessage & {
		id?: string;
		animationState?: "start" | "animating" | "done" | "exited";
	};
	prevMessage?: IMessage;
	shouldCollate?: boolean;
	showHeader: boolean;
	isFullscreen?: boolean;
	onDismissFullscreen?: () => void;
	onEmitAnalytics?: (event: string, payload?: unknown) => void;
	onSetFullscreen?: () => void;
	onSetMessageAnimated?: (
		messageId: string,
		animationState: IStreamingMessage["animationState"],
	) => void;
	theme?: IWebchatTheme;
	"data-message-id"?: string;
}

const WebchatLayout: FC<WebchatLayoutProps> = props => {
	const {
		action,
		className,
		matchedPlugins,
		message,
		prevMessage,
		shouldCollate,
		showHeader,
		isFullscreen,
		onDismissFullscreen,
		onEmitAnalytics,
		onSetFullscreen,
		onSetMessageAnimated,
		theme,
		"data-message-id": dataMessageId,
	} = props;

	const rootClassName = classnames(
		"webchat-message-row",
		message.source,
		className,
		classes.message,
		shouldCollate && classes.collated,
		isFullscreen && classes.fullscreen,
	);

	return (
		<article
			{...(message.id ? { id: message.id } : {})}
			className={rootClassName}
			data-message-id={dataMessageId}
		>
			{showHeader && <MessageHeader enableAvatar={message.source !== "user"} />}
			{matchedPlugins.map((plugin, index) =>
				plugin.component ? (
					<plugin.component
						attributes={{ styles: {} }}
						isFullscreen={isFullscreen}
						key={index}
						message={message}
						onDismissFullscreen={onDismissFullscreen}
						onEmitAnalytics={onEmitAnalytics}
						onSendMessage={action}
						onSetFullscreen={onSetFullscreen}
						prevMessage={prevMessage}
						theme={theme}
						onSetMessageAnimated={onSetMessageAnimated}
					/>
				) : null,
			)}
			<div
				id={`webchat-focus-target-${dataMessageId}`}
				tabIndex={-1}
				className={mainClasses.srOnly}
				aria-hidden="true"
			/>
		</article>
	);
};

export default WebchatLayout;
