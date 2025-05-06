import { useContext, useState, useEffect, useRef } from "react";
import { MessageContext } from "./context.tsx";
import { CollateMessage, getRandomId } from "src/utils.ts";
import { CollationContext } from "./collation.tsx";
import { getLiveRegionContent, MessageType } from "./live-region-helper.ts";

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

// Custom hook for setting the live region text for the screen reader when new messages arrive
interface IUseLiveRegionProps {
	messageType: MessageType;
	data: any;
	validation?: () => boolean;
}

const useLiveRegion = ({ messageType, data, validation }: IUseLiveRegionProps) => {
	const previousLiveContentRef = useRef<string | undefined>(undefined);
	const {
		onSetLiveRegionText,
		"data-message-id": dataMessageId,
		headerInfo,
	} = useMessageContext();

	useEffect(() => {
		if (validation && !validation()) return;

		const messageContent = getLiveRegionContent(messageType, data);

		if (
			messageContent &&
			messageContent !== previousLiveContentRef.current &&
			onSetLiveRegionText &&
			dataMessageId
		) {
			const liveRegionContent = `${headerInfo} ${messageContent}`;

			onSetLiveRegionText(dataMessageId, liveRegionContent);
			previousLiveContentRef.current = messageContent;
		}
	}, [messageType, data, onSetLiveRegionText, validation, dataMessageId, headerInfo]);
};

export { useMessageContext, useRandomId, useCollation, useLiveRegion };
