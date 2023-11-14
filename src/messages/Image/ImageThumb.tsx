import classes from "./Image.module.css";
import classnames from "classnames/bind";
import { useImageMessageContext } from "./hooks";
import { useMessageContext } from "src/hooks";
import { SingleButton } from "src/common/ActionButtons";
import { DownloadIcon } from "src/assets/svg";

const cx = classnames.bind(classes);

const ImageThumb = () => {
	const { config } = useMessageContext();
	const { url, altText, isDownloadable, onExpand, button } = useImageMessageContext();

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		event.key === "Enter" && onExpand && onExpand();
	};

	const isDynamicRatio = !!config?.settings?.dynamicImageAspectRatio;

	const imageClasses = cx({
		wrapper: true,
		flexImage: !isDynamicRatio,
		fixedImage: isDynamicRatio,
		wrapperDownloadable: isDownloadable,
	});

	return (
		<div
			className={imageClasses}
			onClick={() => onExpand()}
			onKeyDown={handleKeyDown}
			tabIndex={isDownloadable ? 0 : -1}
			role={isDownloadable ? "button" : undefined}
			aria-label={isDownloadable ? "View Image in fullsize" : undefined}
			data-testid="image-message"
		>
			<img src={url} alt={altText || "Attachment Image"} />
			{button && (
				<SingleButton
					type="primary"
					button={button}
					buttonClassName="webchat-buttons-template-button"
					containerClassName={classes.downloadButtonWrapper}
					icon={<DownloadIcon />}
				/>
			)}
		</div>
	);
};

export default ImageThumb;
