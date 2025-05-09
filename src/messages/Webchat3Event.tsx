import { FC } from "react";
import { useMessageContext } from "src/messages/hooks";
import ChatEvent from "src/common/ChatEvent";

const Webchat3Event: FC = () => {
	const { message, "data-message-id": dataMessageId } = useMessageContext();

	if (message?.data?._cognigy?._webchat3?.type !== "liveAgentEvent") return null;

	const text = message?.data?._cognigy?._webchat3?.payload?.text;
	if (!text) return null;

	return <ChatEvent text={text} dataMessageId={dataMessageId} />;
};

export default Webchat3Event;
