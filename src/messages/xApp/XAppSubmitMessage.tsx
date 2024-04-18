import { ChatEvent } from "src/index";
import { useMessageContext } from "../hooks";

import type { IPluginXAppSubmit } from "@cognigy/socket-client/lib/interfaces/messageData";

const XAppSubmitMessage = () => {
	const { message } = useMessageContext();

	// TODO remove any after socket-client update
	const { success, text } = (message?.data?._plugin as IPluginXAppSubmit as any)?.data || {};

	return <ChatEvent text={success ? text : "Submission failed"} />;
};

export default XAppSubmitMessage;
