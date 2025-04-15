import { forwardRef, useState } from "react";
import classes from "./Image.module.css";
import classnames from "classnames/bind";
import { useImageMessageContext } from "./hooks";
import { useMessageContext } from "src/messages/hooks";
import { PrimaryButton } from "src/common/Buttons";
import { DownloadIcon } from "src/assets/svg";

const cx = classnames.bind(classes);

const ImageThumb = forwardRef((_props, ref) => {
	const { config, action, onEmitAnalytics } = useMessageContext();
	const { url, altText, isDownloadable, onExpand, button } = useImageMessageContext();
	const [isImageBroken, setImageBroken] = useState(false);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter" || event.key === " ") {
			if (onExpand) onExpand();
		}
	};

	const isDynamicRatio = !!config?.settings?.layout?.dynamicImageAspectRatio;

	const wrapperClasses = cx({
		wrapper: true,
		wrapperDownloadable: isDownloadable,
	});

	const imageClasses = cx({
		"webchat-media-template-image": true,
		flexImage: !isDynamicRatio,
		fixedImage: isDynamicRatio,
	});

	const viewImageInFullsizeLabel =
		config?.settings.customTranslations?.ariaLabels?.viewImageInFullsize ||
		"View full-size image";
	return (
		<div className={wrapperClasses}>
			<div
				ref={ref as React.RefObject<HTMLDivElement>}
				className={imageClasses}
				onClick={() => onExpand()}
				onKeyDown={handleKeyDown}
				tabIndex={isDownloadable ? 0 : -1}
				role={isDownloadable ? "button" : undefined}
				aria-label={isDownloadable ? viewImageInFullsizeLabel : undefined}
				data-testid="image-message"
			>
				{isImageBroken ? (
					<span className={classes.brokenImage} />
				) : (
					<img src={url} alt={altText} onError={() => setImageBroken(true)} />
				)}
			</div>
			{button && (
				<PrimaryButton
					isActionButton
					button={button}
					buttonClassName="webchat-buttons-template-button"
					containerClassName={classes.downloadButtonWrapper}
					customIcon={<DownloadIcon />}
					action={action}
					config={config}
					onEmitAnalytics={onEmitAnalytics}
				/>
			)}
		</div>
	);
});

export default ImageThumb;
