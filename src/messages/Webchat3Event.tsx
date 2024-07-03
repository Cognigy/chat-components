import { FC } from "react";
import { useMessageContext } from "src/messages/hooks";
import ChatEvent from "src/common/ChatEvent";
import { ILiveAgentEvent } from "@cognigy/socket-client";

const Webchat3Event: FC = () => {
	const { message } = useMessageContext();
	const text = (message?.data?._cognigy?._webchat3 as ILiveAgentEvent)?.payload?.text;

	if (!text) return null;

	return <ChatEvent text={text} />;
};

export default Webchat3Event;
