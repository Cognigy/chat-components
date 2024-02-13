import { useContext, useState } from "react";
import { MessageContext } from "./context.tsx";
import { getRandomId } from "src/utils.ts";

function useMessageContext() {
	const state = useContext(MessageContext);

	if (!state) {
		throw new Error("useChatMessageContext must be used within a ChatMessageContextProvider");
	}

	return state;
}

const useRandomId = (prefix = "") => {
	const [id] = useState(() => getRandomId(prefix));

	return id;
};

export { useMessageContext, useRandomId };
