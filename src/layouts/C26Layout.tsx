import { FC, ReactNode } from "react";
import classnames from "classnames";

import { C26Label } from "../messages/types";
import { BaseLayoutProps, MatchedPlugins, MessageFocusTarget } from "./shared";

import classes from "./C26Layout.module.css";

export interface C26LayoutProps extends BaseLayoutProps {
	label?: C26Label;
	avatar?: ReactNode;
}

const formatTimestamp = (value?: string | number): string => {
	const ms = value ? Number(value) : Date.now();
	return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const C26Layout: FC<C26LayoutProps> = props => {
	const { className, message, label, avatar, "data-message-id": dataMessageId } = props;
	const timestamp = formatTimestamp(message?.timestamp);

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
				<span className={classes.label} data-testid="c26-label">
					{label.icon && <span className={classes.labelIcon}>{label.icon}</span>}
					{label.text}
				</span>
			)}
			<div className={classes.bubble} data-testid="c26-bubble">
				<MatchedPlugins {...props} />
			</div>
			<time className={classes.timestamp} data-testid="c26-timestamp">
				{timestamp}
			</time>
			<MessageFocusTarget dataMessageId={dataMessageId} />
		</article>
	);
};

export default C26Layout;
