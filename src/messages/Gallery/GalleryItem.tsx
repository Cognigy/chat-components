import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { FC, KeyboardEvent, useMemo, useState } from "react";
import classes from "./Gallery.module.css";
import buttonClasses from "src/common/ActionButtons/SingleButtons.module.css";
import { useMessageContext } from "../hooks";
import classnames from "classnames";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { sanitizeHTML } from "src/sanitize";
import { getRandomId } from "src/utils";
import { sanitizeUrl } from "@braintree/sanitize-url";

export interface GallerySlideProps {
	slide: IWebchatAttachmentElement;
	contentId: string;
}

const GalleryItem: FC<GallerySlideProps> = props => {
	const { slide, contentId } = props;
	const { title, subtitle, image_url, image_alt_text, buttons, default_action } = slide;
	const { action, config } = useMessageContext();
	const hasExtraInfo = subtitle || buttons?.length > 0;
	const [isImageBroken, setImageBroken] = useState(false);

	const isSanitizeEnabled = !config?.settings?.disableHtmlContentSanitization;
	const titleHtml = isSanitizeEnabled ? sanitizeHTML(title) : title;
	const subtitleHtml = isSanitizeEnabled ? sanitizeHTML(subtitle) : subtitle;

	const titleId = useMemo(() => getRandomId("webchatCarouselTemplateTitle"), []);
	const subtitleId = useMemo(() => getRandomId("webchatCarouselTemplateSubtitle"), []);

	const handleClick = () => {
		if (!default_action?.url) return;

		const url = config?.settings?.disableUrlButtonSanitization
			? default_action.url
			: sanitizeUrl(default_action.url);

		// prevent no-ops from sending you to a blank page
		if (url === "about:blank") return;
		window.open(url);
		return;
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (default_action && event.key === "Enter") {
			handleClick();
		}
	};

	return (
		<div className={classnames("webchat-carousel-template-frame", classes.slideItem)}>
			<div className={classnames(classes.top, hasExtraInfo && classes.hasExtraInfo)}>
				<h2
					dangerouslySetInnerHTML={{ __html: titleHtml }}
					className="webchat-carousel-template-title"
					id={titleId}
				/>
				{isImageBroken ? (
					<span className={classes.brokenImage} />
				) : (
					<img
						src={image_url}
						alt={image_alt_text || "Attachment Image"}
						className={classes.slideImage}
						onError={() => setImageBroken(true)}
					/>
				)}
			</div>
			{hasExtraInfo && (
				<div
					className={classnames("webchat-carousel-template-content", classes.bottom)}
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					role={default_action?.url ? "link" : undefined}
					id={contentId}
					aria-describedby={subtitle ? subtitleId : undefined}
					aria-labelledby={title ? titleId : undefined}
					aria-label={default_action?.url ? `${titleHtml}. Opens in new tab` : undefined}
				>
					{subtitle && (
						<p
							dangerouslySetInnerHTML={{ __html: subtitleHtml }}
							id={subtitleId}
							className="webchat-carousel-template-subtitle"
						/>
					)}
					{buttons?.length > 0 && (
						<ActionButtons
							buttonClassName={classnames(
								buttonClasses.primaryButton,
								"webchat-carousel-template-button",
							)}
							payload={buttons}
							action={action}
						/>
					)}
				</div>
			)}
		</div>
	);
};

export default GalleryItem;
