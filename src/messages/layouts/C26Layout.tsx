import { FC, ReactNode } from "react";
import classnames from "classnames";

import { MessagePlugin } from "../../matcher";
import { C26Label, IStreamingMessage, IWebchatTheme, MessageSender } from "../types";
import { IMessage } from "@cognigy/socket-client";

import classes from "./C26Layout.module.css";
import mainClasses from "src/main.module.css";

export interface C26LayoutProps {
	action?: MessageSender;
	className?: string;
	matchedPlugins: MessagePlugin[];
	message: IMessage & {
		id?: string;
		animationState?: "start" | "animating" | "done" | "exited";
	};
	prevMessage?: IMessage;
	isFullscreen?: boolean;
	label?: C26Label;
	avatar?: ReactNode;
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

const C26Layout: FC<C26LayoutProps> = props => {
	const {
		action,
		className,
		matchedPlugins,
		message,
		prevMessage,
		isFullscreen,
		label,
		avatar,
		onDismissFullscreen,
		onEmitAnalytics,
		onSetFullscreen,
		onSetMessageAnimated,
		theme,
		"data-message-id": dataMessageId,
	} = props;

	const rootClassName = classnames(
		"c26-message-row",
		message.source,
		className,
		classes.article,
		!avatar && classes.noAvatar,
	);

	return (
		<article
			{...(message.id ? { id: message.id } : {})}
			className={rootClassName}
			data-layout="c26"
			data-source={message.source}
			data-message-id={dataMessageId}
		>
			{avatar && (
				<div className={classes.avatar} data-testid="c26-avatar">
					{avatar}
				</div>
			)}
			{label && (
				<div className={classes.label} data-testid="c26-label">
					{label.icon && <span className={classes.labelIcon}>{label.icon}</span>}
					<span>{label.text}</span>
				</div>
			)}
			<div className={classes.content}>
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
			</div>
			<div
				id={`c26-focus-target-${dataMessageId}`}
				tabIndex={-1}
				className={mainClasses.srOnly}
				aria-hidden="true"
			/>
		</article>
	);
};

export default C26Layout;
