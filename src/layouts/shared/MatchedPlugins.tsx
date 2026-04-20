import { FC } from "react";

import { BaseLayoutProps } from "./types";

type Props = Pick<
	BaseLayoutProps,
	| "action"
	| "matchedPlugins"
	| "message"
	| "prevMessage"
	| "isFullscreen"
	| "onDismissFullscreen"
	| "onEmitAnalytics"
	| "onSetFullscreen"
	| "onSetMessageAnimated"
	| "theme"
>;

export const MatchedPlugins: FC<Props> = ({
	action,
	matchedPlugins,
	message,
	prevMessage,
	isFullscreen,
	onDismissFullscreen,
	onEmitAnalytics,
	onSetFullscreen,
	onSetMessageAnimated,
	theme,
}) => (
	<>
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
	</>
);
