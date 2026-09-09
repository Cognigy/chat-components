import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { FC, KeyboardEvent, useState } from "react";
import classes from "./Gallery.module.css";
import buttonClasses from "src/common/Buttons/Buttons.module.css";
import { useMessageContext, useRandomId } from "../hooks";
import classnames from "classnames";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { useSanitize } from "src/sanitize";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { Typography } from "src/index";

export interface GallerySlideProps {
	slide: IWebchatAttachmentElement;
	contentId: string;
}

const GalleryItem: FC<GallerySlideProps> = props => {
	const { slide, contentId } = props;
	const { title, subtitle, image_url, image_alt_text, buttons, default_action } = slide;
	const {
		action,
		config,
		onEmitAnalytics,
		messageParams,
		"data-message-id": dataMessageId,
	} = useMessageContext();
	const hasExtraInfo = subtitle || (buttons && buttons?.length > 0);
	// Opt-in layout: when enabled the title renders in the content block beneath
	// the image instead of overlaying it (CSA-85062). Defaults to the legacy
	// overlay so existing consumers' DOM is unchanged.
	const titleBelowImage = !!config?.settings?.layout?.galleryCardTitleBelowImage;
	const [isImageBroken, setImageBroken] = useState(false);
	const { processHTML } = useSanitize();

	// `title`/`subtitle` are optional on gallery elements; coalesce to "" so
	// processHTML never receives undefined (it expects a string and the result
	// is interpolated into ARIA labels).
	const titleHtml = processHTML(title || "");
	const subtitleHtml = processHTML(subtitle || "");
	// Whether there is a visible title *after* sanitization. Guarding on the raw
	// `title` is unsafe: a value that is entirely strippable markup (e.g.
	// "<script>…</script>") is truthy but sanitizes to "", which would otherwise
	// render a blank <h4> and force an empty content block beneath the image.
	const hasTitle = !!titleHtml;

	// The content block (and the squared-off image corners it forces) must show
	// whenever there is something below the image. With the overlay layout that's
	// only subtitle/buttons; with the opt-in layout a title-only card also needs
	// the block because the title now lives there.
	const showContentBlock = (titleBelowImage && hasTitle) || hasExtraInfo;

	const titleId = useRandomId("webchatCarouselTemplateTitle");
	const subtitleId = useRandomId("webchatCarouselTemplateSubtitle");

	const shouldBeDisabled = messageParams?.isConversationEnded;

	const opensInNewTab =
		config?.settings.customTranslations?.ariaLabels?.opensInNewTab ?? "Opens in new tab";

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

	const titleElement = (
		<Typography
			variant="body-semibold"
			component="h4"
			dangerouslySetInnerHTML={{ __html: titleHtml }}
			className="webchat-carousel-template-title"
			id={titleId}
		/>
	);
	const subtitleElement = subtitle && (
		<Typography
			variant="body-regular"
			dangerouslySetInnerHTML={{ __html: subtitleHtml }}
			id={subtitleId}
			className="webchat-carousel-template-subtitle"
		/>
	);

	// Where the default_action link lives (CGY-37634). Legacy Webchat and
	// ListItem make the card's *text* the link and keep the buttons outside it:
	// a link must not contain interactive descendants (HTML content model;
	// screen readers expose nested buttons inconsistently), and with the
	// buttons inside, Enter on a button bubbled to the link's handler and
	// opened the URL as well. When the content block has no text to wrap
	// (overlay title, no subtitle) the image + title area is the link instead,
	// so the target is always visible and keyboard-reachable.
	const hasBlockText = !!subtitle || (titleBelowImage && hasTitle);
	const linkTarget = default_action?.url ? (hasBlockText ? "text" : "top") : null;
	const linkProps = linkTarget
		? {
				role: "link" as const,
				tabIndex: 0,
				onClick: handleClick,
				onKeyDown: handleKeyDown,
				"aria-labelledby": hasTitle ? titleId : undefined,
				"aria-describedby": subtitle ? subtitleId : undefined,
				"aria-label": `${titleHtml}. ${opensInNewTab}`,
			}
		: {};

	return (
		<div className={classnames("webchat-carousel-template-frame", classes.slideItem)}>
			<div
				className={classnames(classes.top, showContentBlock && classes.hasExtraInfo)}
				{...(linkTarget === "top" ? linkProps : {})}
			>
				{!titleBelowImage && hasTitle && titleElement}
				{isImageBroken ? (
					<span className={classes.brokenImage} />
				) : (
					<img
						src={image_url}
						alt={image_alt_text || ""}
						className={classes.slideImage}
						onError={() => setImageBroken(true)}
					/>
				)}
			</div>
			{showContentBlock && (
				<div
					className={classnames("webchat-carousel-template-content", classes.bottom)}
					id={contentId}
				>
					{linkTarget === "text" ? (
						<div
							className={classnames("webchat-carousel-template-link", classes.link)}
							{...linkProps}
						>
							{titleBelowImage && hasTitle && titleElement}
							{subtitleElement}
						</div>
					) : (
						<>
							{titleBelowImage && hasTitle && titleElement}
							{subtitleElement}
						</>
					)}
					{buttons && buttons?.length > 0 && (
						<ActionButtons
							dataMessageId={dataMessageId}
							buttonClassName={classnames(
								buttonClasses.primaryButton,
								buttonClasses.actionButton,
								"webchat-carousel-template-button",
							)}
							buttonListItemClassName={classes.buttonListItem}
							payload={buttons}
							action={shouldBeDisabled ? undefined : action}
							config={config}
							onEmitAnalytics={onEmitAnalytics}
							templateTextId={hasTitle ? titleId : undefined}
						/>
					)}
				</div>
			)}
		</div>
	);
};

export default GalleryItem;
