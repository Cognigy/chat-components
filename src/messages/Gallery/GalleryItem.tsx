import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { FC, KeyboardEvent, useState } from "react";
import classes from "./Gallery.module.css";
import buttonClasses from "src/common/Buttons/Buttons.module.css";
import { useMessageContext, useRandomId } from "../hooks";
import classnames from "classnames";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { sanitizeHTML } from "src/sanitize";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { Typography } from "src/index";

export interface GallerySlideProps {
	slide: IWebchatAttachmentElement;
	contentId: string;
}

const GalleryItem: FC<GallerySlideProps> = props => {
	const { slide, contentId } = props;
	const { title, subtitle, image_url, image_alt_text, buttons, default_action } = slide;
	const { action, config, onEmitAnalytics, messageParams } = useMessageContext();
	const hasExtraInfo = subtitle || (buttons && buttons?.length > 0);
	const [isImageBroken, setImageBroken] = useState(false);

	const isSanitizeEnabled = !config?.settings?.layout?.disableHtmlContentSanitization;
	const titleHtml = isSanitizeEnabled ? sanitizeHTML(title) : title;
	const subtitleHtml = isSanitizeEnabled ? sanitizeHTML(subtitle) : subtitle;

	const titleId = useRandomId("webchatCarouselTemplateTitle");
	const subtitleId = useRandomId("webchatCarouselTemplateSubtitle");

	const shouldBeDisabled = messageParams?.isConversationEnded;

	const handleClick = () => {
		if (!default_action?.url) return;

		const url = config?.settings?.layout?.disableUrlButtonSanitization
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
	const opensInNewTab =
		config?.settings.customTranslations?.ariaLabels?.opensInNewTab ?? "Opens in new tab";
	return (
		<div className={classnames("webchat-carousel-template-frame", classes.slideItem)}>
			<div className={classnames(classes.top, hasExtraInfo && classes.hasExtraInfo)}>
				<Typography
					variant="body-semibold"
					component="h2"
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
					aria-describedby={default_action?.url && subtitle ? subtitleId : undefined}
					aria-labelledby={default_action?.url && title ? titleId : undefined}
					aria-label={default_action?.url ? `${titleHtml}. ${opensInNewTab}` : undefined}
				>
					{subtitle && (
						<Typography
							variant="body-regular"
							dangerouslySetInnerHTML={{ __html: subtitleHtml }}
							id={subtitleId}
							className="webchat-carousel-template-subtitle"
						/>
					)}
					{buttons && buttons?.length > 0 && (
						<ActionButtons
							buttonClassName={classnames(
								buttonClasses.primaryButton,
								buttonClasses.actionButton,
								"webchat-carousel-template-button",
							)}
							payload={buttons}
							action={shouldBeDisabled ? undefined : action}
							config={config}
							onEmitAnalytics={onEmitAnalytics}
							templateTextId={title ? titleId : undefined}
						/>
					)}
				</div>
			)}
		</div>
	);
};

export default GalleryItem;
