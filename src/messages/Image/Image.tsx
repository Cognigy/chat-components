import { FC, useMemo, useRef, useState } from "react";
import { ImageMessageContext } from "./context";
import Lightbox from "./lightbox/Lightbox";
import ImageThumb from "./ImageThumb";
import { useMessageContext } from "src/messages/hooks";
import { getChannelPayload, resolveAttachmentUrl } from "src/utils";
import { IWebchatButton, IWebchatImageAttachment } from "@cognigy/socket-client";

const Image: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { url, altText, buttons, downloadUrl } =
		(
			payload?.message?.attachment as IWebchatImageAttachment & {
				payload: { downloadUrl?: string };
			}
		)?.payload || {};
	const resolvedUrl = resolveAttachmentUrl({ url, downloadUrl });

	const button = buttons?.[0];

	const buttonRef = useRef<HTMLDivElement>(null);

	const isDownloadable =
		(buttons as IWebchatButton[])?.find(
			button => "type" in button && button.type === "web_url",
		) !== undefined;

	const [showLightbox, setShowLightbox] = useState(false);

	const contextValue = useMemo(
		() => ({
			onExpand: () => isDownloadable && setShowLightbox(true),
			onClose: () => {
				setShowLightbox(false);
				buttonRef.current?.focus(); // Restore focus after closing the lightbox
			},
			url: resolvedUrl,
			altText,
			isDownloadable,
			button,
		}),
		[altText, button, isDownloadable, resolvedUrl],
	);

	if (!resolvedUrl) return null;

	return (
		<ImageMessageContext.Provider value={contextValue}>
			<ImageThumb ref={buttonRef} />
			{showLightbox && <Lightbox />}
		</ImageMessageContext.Provider>
	);
};

export default Image;
