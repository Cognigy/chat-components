import { FC, useMemo } from "react";
import classnames from "classnames";

import MessageHeader from "../common/MessageHeader";
import { match, MessagePlugin } from "../matcher";
import { MessageProvider } from "./context";
import { IWebchatConfig, IWebchatTheme, MessageSender } from "./types";

import "src/theme.css";
import classes from "./Message.module.css";
import { isEventMessage, isMessageCollatable } from "../utils";
import { IMessage } from "@cognigy/socket-client";

export interface MessageProps {
	action?: MessageSender;
	className?: string;
	config?: IWebchatConfig;
	disableHeader?: boolean;
	hasReply?: boolean;
	isConversationEnded?: boolean;
	isFullscreen?: boolean;
	message: IMessage;
	onDismissFullscreen?: () => void;
	onEmitAnalytics?: (event: string, payload?: unknown) => void;
	onSendMessage?: MessageSender; // = "prop.action", for legacy plugins
	onSetFullscreen?: () => void;
	openXAppOverlay?: (url: string | undefined) => void;
	plugins?: MessagePlugin[];
	prevMessage?: IMessage;
	theme?: IWebchatTheme;
	attributes?: React.HTMLProps<HTMLDivElement> & { styles?: React.CSSProperties };
}

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
		plugins,
		prevMessage,
	} = props;
	const shouldCollate = isMessageCollatable(message, prevMessage);

	const showHeader = !shouldCollate && !isFullscreen && !isEventMessage(message);

	const rootClassName = classnames(
		"webchat-message-row",
		message.source,
		className,
		classes.message,
		shouldCollate && classes.collated,
		isFullscreen && classes.fullscreen,
	);

	const matchedPlugins = match(message, config, plugins);

	const messageParams = useMemo(
		() => ({ hasReply, isConversationEnded }),
		[hasReply, isConversationEnded],
	);

	/**
	 * No rule matched the message, so we don't render anything.
	 */
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
				/>
			);
		}
	}

	return (
		<MessageProvider
			action={action}
			config={config}
			message={message}
			messageParams={messageParams}
			onEmitAnalytics={onEmitAnalytics}
			openXAppOverlay={openXAppOverlay}
		>
			<article className={rootClassName}>
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
							theme={props.theme}
						/>
					) : null,
				)}
			</article>
		</MessageProvider>
	);
};

export default Message;
