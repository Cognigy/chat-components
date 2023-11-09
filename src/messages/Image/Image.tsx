import { FC, useMemo, useState } from "react";
import { MessagePasstroughProps } from "../types";
import { ImageMessageContext } from "./context";
import Lightbox from "./lightbox/Lightbox";
import ImageThumb from "./ImageThumb";
import { useMessageContext } from "src/hooks";

const Image: FC<MessagePasstroughProps> = props => {
	const { message } = useMessageContext();

	const {
		url,
		isDownloadable = true,
		altText,
		template = "media",
		config,
	} = message?.data?._cognigy?._webchat?.message?.attachment?.payload || {};

	const [showLightbox, setShowLightbox] = useState(false);

	const contextValue = useMemo(
		() => ({
			onExpand: () => isDownloadable && setShowLightbox(true),
			onClose: () => setShowLightbox(false),
			url,
			isDownloadable,
			altText,
			template,
			config,
		}),
		[altText, config, isDownloadable, template, url],
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
