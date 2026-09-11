import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { FC, KeyboardEvent, ReactNode, useState } from "react";
import classes from "./Gallery.module.css";
import buttonClasses from "src/common/Buttons/Buttons.module.css";
import { useMessageContext, useRandomId } from "../hooks";
import classnames from "classnames";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { useSanitize } from "src/sanitize";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { Typography } from "src/index";
import { htmlToPlainText } from "src/utils";

export interface GallerySlideProps {
	slide: IWebchatAttachmentElement;
	contentId: string;
}

// Host of an absolute http(s) URL, "" for anything else (relative paths,
// about:blank) — used as the last-resort link name.
const getHostname = (url: string): string => {
	try {
		const { protocol, hostname } = new URL(url);
		return protocol === "http:" || protocol === "https:" ? hostname : "";
	} catch {
		return "";
	}
};

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
	// Whether there is a visible title/subtitle *after* sanitization. Guarding
	// on the raw strings is unsafe: a value that is entirely strippable markup
	// (e.g. "<script>…</script>") is truthy but sanitizes to "", and rendering
	// on that basis produces a blank <h4>/<p>, an empty content block beneath
	// the image and — for a default_action card — an invisible, focusable link.
	const hasTitle = !!titleHtml;
	const hasSubtitle = !!subtitleHtml;
	const hasButtons = !!buttons && buttons.length > 0;
	const hasExtraInfo = hasSubtitle || hasButtons;

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

	// The default_action URL as opened on activation; "" when the card has
	// none. sanitizeUrl maps dangerous schemes to "about:blank", which is a
	// no-op rather than a navigation to a blank page.
	const linkUrl = default_action?.url
		? config?.settings?.layout?.disableUrlButtonSanitization
			? default_action.url
			: sanitizeUrl(default_action.url)
		: "";

	const handleClick = () => {
		if (!linkUrl || linkUrl === "about:blank") return;
		window.open(linkUrl);
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
	const subtitleElement = hasSubtitle && (
		<Typography
			variant="body-regular"
			dangerouslySetInnerHTML={{ __html: subtitleHtml }}
			id={subtitleId}
			className="webchat-carousel-template-subtitle"
		/>
	);

	// Where the default_action link lives. Like ListItem, the card's *text* is
	// the link and the buttons stay outside it: a link must not contain
	// interactive descendants (HTML content model; screen readers expose
	// nested buttons inconsistently), and a button inside the link also
	// bubbles Enter to the link's handler and opens the URL. When the content
	// block has no text to wrap (overlay title, no subtitle) the image + title
	// area is the link, so the target is always visible and keyboard-reachable.
	const hasBlockText = hasSubtitle || (titleBelowImage && hasTitle);
	const linkTarget = default_action?.url ? (hasBlockText ? "text" : "top") : null;

	// Accessible name of the link, as plain text (an aria-label built from the
	// sanitized HTML announces literal tags). Falls back through the card's
	// visible text, then the image alt, then the destination host — the only
	// purpose-bearing information a card without text or alt has (WCAG 2.4.4
	// Link Purpose); the role itself already conveys "link". A single
	// aria-label carries both the name and the new-tab hint: aria-labelledby
	// takes precedence in the accessible-name computation and suppresses an
	// aria-label, hint included.
	const titleText = linkTarget ? htmlToPlainText(titleHtml) : "";
	const subtitleText = linkTarget ? htmlToPlainText(subtitleHtml) : "";
	const linkName = titleText || subtitleText || image_alt_text || getHostname(linkUrl);
	const linkLabel = [linkName, opensInNewTab].filter(Boolean).join(". ");
	// The subtitle describes the link unless it already *is* its name.
	const linkDescribedBy = hasSubtitle && linkName !== subtitleText ? subtitleId : undefined;

	// Kept as role="link" rather than a real <a href> deliberately: it mirrors
	// ListItem's default_action so both templates share one behaviour
	// (sanitizeUrl / disableUrlButtonSanitization / about:blank guard via
	// window.open) and one CSS hook, and consumers' existing selectors keep
	// matching. Attributes are spelled out (not spread) so the jsx-a11y gate
	// can see the role/tabIndex/key handler on this element.
	const cardLink = (className: string, children: ReactNode) => (
		<div
			className={className}
			role="link"
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			aria-label={linkLabel}
			aria-describedby={linkDescribedBy}
		>
			{children}
		</div>
	);

	const topClassName = classnames(classes.top, showContentBlock && classes.hasExtraInfo);
	const imageArea = (
		<>
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
		</>
	);
	const blockText = (
		<>
			{titleBelowImage && hasTitle && titleElement}
			{subtitleElement}
		</>
	);

	return (
		<div className={classnames("webchat-carousel-template-frame", classes.slideItem)}>
			{linkTarget === "top" ? (
				cardLink(topClassName, imageArea)
			) : (
				<div className={topClassName}>{imageArea}</div>
			)}
			{showContentBlock && (
				<div
					className={classnames("webchat-carousel-template-content", classes.bottom)}
					id={contentId}
				>
					{linkTarget === "text"
						? cardLink(
								classnames("webchat-carousel-template-link", classes.link),
								blockText,
							)
						: blockText}
					{hasButtons && (
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
