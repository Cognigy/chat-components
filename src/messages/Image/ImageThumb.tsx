import classes from "./Image.module.css";
import classnames from "classnames/bind";
import { getBackgroundImage } from "../../lib/css";
import { useMessangerImageContext } from "./hooks";

const cx = classnames.bind(classes);

const ImageThumb = () => {
	const { config, url, altText, template, isDownloadable, onExpand } = useMessangerImageContext();

	const divTabIndex = isDownloadable ? 0 : -1;
	const divRole = isDownloadable ? "button" : undefined;
	const divAriaLabel = isDownloadable ? "View Image in fullsize" : undefined;

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		event.key === "Enter" && onExpand && onExpand();
	};

	const isDynamicRatio = !config?.settings?.dynamicImageAspectRatio; // temp

	const flexImageClasses = cx({
		flexImage: true,
		wrapper: true,
		wrapperDownloadable: isDownloadable,
	});

	const fixedImageClasses = cx({
		fixedImage: true,
		wrapper: true,
		wrapperDownloadable: isDownloadable,
		templateMedia: template === "media",
		templateGeneric: template === "generic",
		templateList: template === "list",
	});

	const backgroundImage = getBackgroundImage(url);

	return isDynamicRatio ? (
		<div
			className={flexImageClasses}
			onClick={() => onExpand()}
			onKeyDown={handleKeyDown}
			tabIndex={divTabIndex}
			role={divRole}
			aria-label={divAriaLabel}
		>
			<img src={url} alt={altText || "Attachment Image"} />
		</div>
	) : (
		<div
			className={fixedImageClasses}
			style={{ backgroundImage: backgroundImage }}
			onClick={() => onExpand()}
			onKeyDown={handleKeyDown}
			tabIndex={divTabIndex}
			role={divRole}
			aria-label={divAriaLabel}
		>
			<span role="img" aria-label={altText || "Attachment Image"} />
		</div>
	);
};

export default ImageThumb;
