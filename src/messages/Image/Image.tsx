import { FC, useMemo, useState } from "react";
import { ImageMessageContext } from "./context";
import Lightbox from "./lightbox/Lightbox";
import ImageThumb from "./ImageThumb";
import { useMessageContext } from "src/hooks";
import { getChannelPayload } from "src/utils";
import { ActionButtonsProps } from "src/common/ActionButtons/ActionButtons";

const Image: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { url, altText, buttons } = payload.message.attachment.payload;

	const isDownloadable =
		(buttons as ActionButtonsProps["payload"])?.find(
			button => "type" in button && button.type === "web_url",
		) !== undefined;

	const [showLightbox, setShowLightbox] = useState(false);

	const contextValue = useMemo(
		() => ({
			onExpand: () => isDownloadable && setShowLightbox(true),
			onClose: () => setShowLightbox(false),
			url,
			altText,
			isDownloadable,
		}),
		[altText, isDownloadable, url],
	);

	if (!url) return null;

	return (
		<ImageMessageContext.Provider value={contextValue}>
			<ImageThumb />
			{showLightbox && <Lightbox />}
		</ImageMessageContext.Provider>
	);
};

export default Image;
