import { FC, useState } from "react";
import { MessagePasstroughProps } from "../types";
import { MessangerImageContext } from "./context";
import Lightbox from "./lightbox/Lightbox";
import ImageThumb from "./ImageThumb";


const Image: FC<MessagePasstroughProps> = props => {
	const { url, isDownloadable = true, altText, template = 'media', config } =
		props?.message?.data?._cognigy?._webchat?.message?.attachment?.payload || {};

	const [showLightbox, setShowLightbox] = useState(false);

	if (!url) return null;

	return (
		<MessangerImageContext.Provider
			value={{
				onExpand: () => isDownloadable && setShowLightbox(true),
				onClose: () => setShowLightbox(false),
				url,
				isDownloadable,
				altText,
				template,
				config
			}}
		>
			<ImageThumb />
			{showLightbox && <Lightbox />}
		</MessangerImageContext.Provider>
	);
};

export default Image;
