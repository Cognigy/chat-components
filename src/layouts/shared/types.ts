import { MessagePlugin } from "../../matcher";
import { IMessage } from "@cognigy/socket-client";
import { IStreamingMessage, IWebchatTheme, MessageSender } from "../../messages/types";

export interface BaseLayoutProps {
	action?: MessageSender;
	className?: string;
	matchedPlugins: MessagePlugin[];
	message: IMessage & {
		id?: string;
		animationState?: "start" | "animating" | "done" | "exited";
	};
	prevMessage?: IMessage;
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
