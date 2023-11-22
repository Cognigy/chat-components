import { IWebchatAttachmentElement } from "@cognigy/socket-client/lib/interfaces/messageData";
import { FC, KeyboardEvent, useMemo } from "react";
import classes from "./Gallery.module.css";
import buttonClasses from "src/common/ActionButtons/SingleButtons.module.css";
import { useMessageContext } from "../hooks";
import classnames from "classnames";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { sanitizeHTML } from "src/sanitize";
import { getRandomId } from "src/utils";

export interface GallerySlideProps {
	slide: IWebchatAttachmentElement;
	contentId: string;
}

const GalleryItem: FC<GallerySlideProps> = props => {
	const { slide, contentId } = props;
	const { title, subtitle, image_url, buttons, default_action } = slide;
	const { action, config } = useMessageContext();
	const hasExtraInfo = subtitle || buttons.length > 0;

	const isSanitizeEnabled = !config?.settings?.disableHtmlContentSanitization;
	const titleHtml = isSanitizeEnabled ? sanitizeHTML(title) : title;
	const subtitleHtml = isSanitizeEnabled ? sanitizeHTML(subtitle) : subtitle;

	const titleId = useMemo(() => getRandomId("webchatCarouselTemplateTitle"), []);
	const subtitleId = useMemo(() => getRandomId("webchatCarouselTemplateSubtitle"), []);

	const handleKeyDown = (event: KeyboardEvent) => {
		if (default_action && event.key === "Enter") {
			action && action(undefined, default_action);
		}
	};

	const handleClick = () => {
		default_action && action && action(undefined, default_action);
	};

	return (
		<div className={classnames("webchat-carousel-template-frame", classes.slideItem)}>
			<div className={classnames(classes.top, hasExtraInfo && classes.hasExtraInfo)}>
				<h2
					dangerouslySetInnerHTML={{ __html: titleHtml }}
					className="webchat-carousel-template-title"
					id={titleId}
				/>
				<img src={image_url} className={classes.slideImage} />
			</div>
			{hasExtraInfo && (
				<div
					className={classnames("webchat-carousel-template-content", classes.bottom)}
					onClick={handleClick}
					role={default_action?.url ? "link" : undefined}
					onKeyDown={handleKeyDown}
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
					{buttons.length > 0 && (
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
