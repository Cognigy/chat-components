import { ChatEvent } from "src/index";
import { useLiveRegion, useMessageContext } from "../hooks";

import type { IPluginXAppSubmit } from "@cognigy/socket-client/lib/interfaces/messageData";

interface XAppSubmitPluginData {
	success?: boolean;
	text?: string;
}

const XAppSubmitMessage = () => {
	const { message, "data-message-id": dataMessageId } = useMessageContext();

	const plugin = message?.data?._plugin as IPluginXAppSubmit | undefined;
	const pluginData =
		(plugin?.data ? (plugin.data as unknown as XAppSubmitPluginData) : undefined) || {};
	const { success, text } = pluginData;

	useLiveRegion({
		messageType: "event",
		data: { dataMessageId },
		validation: () => !!dataMessageId,
	});

	return <ChatEvent text={success ? text : "Submission failed"} />;
};

export default XAppSubmitMessage;
