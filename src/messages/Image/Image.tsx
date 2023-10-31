import { FC, useMemo, useState } from "react";
import { MessagePasstroughProps } from "../types";
import { MessangerImageContext } from "./context";
import Lightbox from "./lightbox/Lightbox";
import ImageThumb from "./ImageThumb";

const Image: FC<MessagePasstroughProps> = props => {
	const {
		url,
		isDownloadable = true,
		altText,
		template = "media",
		config,
	} = props?.message?.data?._cognigy?._webchat?.message?.attachment?.payload || {};

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
		<MessangerImageContext.Provider value={contextValue}>
			<ImageThumb />
			{showLightbox && <Lightbox />}
		</MessangerImageContext.Provider>
	);
};

export default Image;
