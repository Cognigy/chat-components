import { useContext, useState, useEffect, useRef } from "react";
import { MessageContext } from "./context.tsx";
import { CollateMessage, getRandomId } from "src/utils.ts";
import { CollationContext } from "./collation.tsx";
import { getLiveRegionContent, MessageType } from "./live-region-helper.ts";
import type { IUploadFileAttachmentData } from "@cognigy/socket-client";

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
interface LiveRegionMessageData {
	text?: string;
	buttons?: string[];
	slides?: { slideText?: string; buttonLabels?: string[] }[];
	altText?: string;
	isDownloadable?: boolean;
	hasTranscript?: boolean;
	hasCaptions?: boolean;
	attachments?: IUploadFileAttachmentData[];
	speakText?: string;
	dataMessageId?: string;
}

interface IUseLiveRegionProps {
	messageType: MessageType;
	data: LiveRegionMessageData;
	validation?: () => boolean;
}

const useLiveRegion = ({ messageType, data, validation }: IUseLiveRegionProps) => {
	const previousLiveContentRef = useRef<string | undefined>(undefined);
	const {
		onSetLiveRegionText,
		"data-message-id": dataMessageId,
		headerInfo,
		config,
	} = useMessageContext();

	useEffect(() => {
		if (validation && !validation()) return;

		const messageContent = getLiveRegionContent(messageType, data as any, config);

		const liveRegionContent =
			headerInfo !== null ? `${headerInfo} ${messageContent}` : messageContent;

		if (
			messageContent &&
			headerInfo !== "" &&
			liveRegionContent !== previousLiveContentRef.current &&
			onSetLiveRegionText &&
			dataMessageId
		) {
			onSetLiveRegionText(dataMessageId, liveRegionContent as string);
			previousLiveContentRef.current = liveRegionContent;
		}
	}, [messageType, data, onSetLiveRegionText, validation, dataMessageId, headerInfo, config]);
};

export { useMessageContext, useRandomId, useCollation, useLiveRegion };
