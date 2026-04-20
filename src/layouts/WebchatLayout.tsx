import { FC } from "react";
import classnames from "classnames";

import MessageHeader from "../common/MessageHeader";
import { BaseLayoutProps, MatchedPlugins, MessageFocusTarget } from "./shared";

import classes from "./WebchatLayout.module.css";

export interface WebchatLayoutProps extends BaseLayoutProps {
	shouldCollate?: boolean;
	showHeader: boolean;
}

const WebchatLayout: FC<WebchatLayoutProps> = props => {
	const {
		className,
		message,
		shouldCollate,
		showHeader,
		isFullscreen,
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
			<MatchedPlugins {...props} />
			<MessageFocusTarget dataMessageId={dataMessageId} />
		</article>
	);
};

export default WebchatLayout;
