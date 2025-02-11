import { useContext, useState } from "react";
import { MessageContext } from "./context.tsx";
import { CollateMessage, getRandomId } from "src/utils.ts";
import { CollationContext } from "./collation.tsx";

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

// Custom hook for using the collation context
function useCollation(): CollateMessage | undefined {
	const context = useContext(CollationContext);
	return context ?? undefined;
}

export { useMessageContext, useRandomId, useCollation };
