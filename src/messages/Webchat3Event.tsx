import { FC } from "react";
import { useMessageContext } from "src/messages/hooks";
import ChatEvent from "src/common/ChatEvent";

const Webchat3Event: FC = () => {
	const { message } = useMessageContext();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const text = (message?.data?._cognigy as unknown as any)?._webchat3?.payload?.text;

	if (!text) return null;

	return <ChatEvent text={text} />;
};

export default Webchat3Event;
