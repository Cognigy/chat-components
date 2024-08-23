import { FC, useMemo, KeyboardEvent } from "react";
import classes from "./List.module.css";
import { useMessageContext, useRandomId } from "src/messages/hooks";
import { sanitizeHTML } from "src/sanitize";
import { getBackgroundImage } from "src/utils";
import { PrimaryButton, SecondaryButton } from "src/common/Buttons";
import classnames from "classnames";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { Typography } from "src/index";

const ListItem: FC<{ element: IWebchatAttachmentElement; isHeaderElement?: boolean }> = props => {
	const { action, config, onEmitAnalytics, messageParams } = useMessageContext();
	const { element, isHeaderElement } = props;
	const { title, subtitle, image_url, image_alt_text, default_action, buttons } = element;
	const button = buttons && buttons?.[0];

	const shouldBeDisabled = messageParams?.isConversationEnded;

	const handleClick = () => {
		if (shouldBeDisabled || !default_action?.url) return;

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

	const isSanitizeEnabled = !config?.settings?.layout?.disableHtmlContentSanitization;

	const titleHtml = isSanitizeEnabled ? sanitizeHTML(title) : title;
	const subtitleHtml = isSanitizeEnabled ? sanitizeHTML(subtitle) : subtitle;
	const subtitleId = useRandomId("webchatListTemplateHeaderSubtitle");

	const rootClasses = classnames(classes.listItemRoot, isHeaderElement && classes.headerRoot);

	const contentClasses = isHeaderElement
		? classnames("webchat-list-template-header", classes.headerContentWrapper)
		: classnames("webchat-list-template-element", classes.listItemWrapper);

	const renderImage = useMemo(() => {
		if (!image_url) return null;
		return (
			<div
				className={classes.listItemImage}
				style={{ backgroundImage: getBackgroundImage(image_url) }}
				data-testid="regular-image"
			>
				<span role="img" aria-label={image_alt_text || "Attachment Image"} />
			</div>
		);
	}, [image_alt_text, image_url]);

	const renderTitles = useMemo(() => {
		if (!titleHtml && !subtitleHtml) return null;
		return (
			<>
				{titleHtml && (
					<Typography
						variant={isHeaderElement ? "h2-semibold" : "title1-semibold"}
						component="h2"
						dangerouslySetInnerHTML={{ __html: titleHtml }}
						className={classnames(
							isHeaderElement
								? "webchat-list-template-header-title"
								: "webchat-list-template-element-title",
							subtitleHtml ? classes.itemTitleWithSubtitle : classes.itemTitle,
						)}
					/>
				)}
				{subtitleHtml && (
					<Typography
						variant="body-regular"
						dangerouslySetInnerHTML={{ __html: subtitleHtml }}
						id={subtitleId}
						className={classnames(
							isHeaderElement
								? "webchat-list-template-header-subtitle"
								: "webchat-list-template-element-subtitle",
							classes.itemSubtitle,
						)}
					/>
				)}
			</>
		);
	}, [subtitleHtml, subtitleId, titleHtml, isHeaderElement]);

	return (
		<div
			role="listitem"
			className={rootClasses}
			style={{
				backgroundImage:
					isHeaderElement && image_url ? getBackgroundImage(image_url) : undefined,
			}}
			data-testid={isHeaderElement ? "header-image" : "list-item"}
		>
			<div
				className={contentClasses}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				role={default_action?.url ? "link" : undefined}
				aria-label={default_action?.url ? `${titleHtml}. Opens in new tab` : undefined}
				aria-describedby={subtitle ? subtitleId : undefined}
				tabIndex={default_action?.url ? 0 : -1}
				style={default_action?.url && !shouldBeDisabled ? { cursor: "pointer" } : {}}
			>
				{isHeaderElement ? (
					<>
						<div
							className={classnames(
								"webchat-list-template-header-content",
								classes.headerContent,
							)}
						>
							{renderTitles}
						</div>
					</>
				) : (
					<div
						className={classnames(
							"webchat-list-template-element-content",
							classes.listItemContent,
						)}
					>
						<div className={classes.listItemText}>{renderTitles}</div>
						{renderImage}
					</div>
				)}
			</div>
			{isHeaderElement ? (
				<PrimaryButton
					isActionButton
					action={shouldBeDisabled ? undefined : action}
					button={button}
					buttonClassName="webchat-list-template-header-button"
					containerClassName={classes.listHeaderButtonWrapper}
					config={config}
					onEmitAnalytics={onEmitAnalytics}
				/>
			) : (
				<SecondaryButton
					isActionButton
					action={shouldBeDisabled ? undefined : action}
					button={button}
					buttonClassName="webchat-list-template-element-button"
					containerClassName={classes.listItemButtonWrapper}
					config={config}
					onEmitAnalytics={onEmitAnalytics}
				/>
			)}
		</div>
	);
};

export default ListItem;
