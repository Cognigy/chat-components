import { ChatEvent } from "src/index";
import { useMessageContext } from "../hooks";

import type { IPluginXAppSubmit } from "@cognigy/socket-client/lib/interfaces/messageData";

const XAppSubmitMessage = () => {
	const { message } = useMessageContext();

	const { success } = (message?.data?._plugin as IPluginXAppSubmit)?.data || {};
	const text = success ? "Submitted successfully" : "Submission failed";

	return <ChatEvent text={text} />;
};

export default XAppSubmitMessage;
