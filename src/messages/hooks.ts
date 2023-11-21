import { useContext } from "react";
import { MessageContext } from "./context.tsx";

function useMessageContext() {
	const state = useContext(MessageContext);

	if (!state) {
		throw new Error("useChatMessageContext must be used within a ChatMessageContextProvider");
	}

	return state;
}

export { useMessageContext };
