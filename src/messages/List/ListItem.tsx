import { FC, useMemo, KeyboardEvent, useEffect } from "react";
import classes from "./List.module.css";
import { useMessageContext, useRandomId } from "src/messages/hooks";
import { useSanitize } from "src/sanitize";
import { getBackgroundImage } from "src/utils";
import { PrimaryButton, SecondaryButton } from "src/common/Buttons";
import classnames from "classnames";
import { sanitizeUrl } from "@braintree/sanitize-url";
import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { Typography } from "src/index";

interface IListItemProps {
	element: IWebchatAttachmentElement;
	isHeaderElement?: boolean;
	headingLevel?: "h4" | "h5";
	id: string;
	onSetScreenReaderLabel?: (text: string) => void;
}

const ListItem: FC<IListItemProps> = props => {
	const {
		action,
		config,
		onEmitAnalytics,
		messageParams,
		"data-message-id": dataMessageId,
	} = useMessageContext();
	const { element, isHeaderElement, headingLevel, id, onSetScreenReaderLabel } = props;
	const { title, subtitle, image_url, image_alt_text, default_action, buttons } = element;
	const button = buttons && buttons?.[0];

	const shouldBeDisabled = messageParams?.isConversationEnded;

	const { processHTML } = useSanitize();

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

	const titleHtml = processHTML(title);
	const subtitleHtml = processHTML(subtitle);
	const subtitleId = useRandomId("webchatListTemplateHeaderSubtitle");

	const rootClasses = classnames(classes.listItemRoot, isHeaderElement && classes.headerRoot);

	const contentClasses = isHeaderElement
		? classnames("webchat-list-template-header", classes.headerContentWrapper)
		: classnames("webchat-list-template-element", classes.listItemWrapper);

	useEffect(() => {
		if (onSetScreenReaderLabel && titleHtml) {
			onSetScreenReaderLabel(titleHtml);
		}
	}, [onSetScreenReaderLabel, titleHtml]);

	const renderImage = useMemo(() => {
		if (!image_url) return null;

		return (
			<div
				className={classes.listItemImage}
				style={{ backgroundImage: getBackgroundImage(image_url) }}
				data-testid="regular-image"
			>
				<span role="img" aria-label={image_alt_text} />
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
						component={headingLevel}
						dangerouslySetInnerHTML={{ __html: titleHtml }}
						className={classnames(
							isHeaderElement
								? "webchat-list-template-header-title"
								: "webchat-list-template-element-title",
							subtitleHtml ? classes.itemTitleWithSubtitle : classes.itemTitle,
						)}
						id={isHeaderElement ? `listHeader-${id}` : `listItemHeader-${id}`}
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
	}, [subtitleHtml, subtitleId, titleHtml, isHeaderElement, headingLevel, id]);

	const opensInNewTabLabel =
		config?.settings.customTranslations?.ariaLabels?.opensInNewTab || "Opens in new tab";

	const Component = isHeaderElement ? "div" : "li";

	return (
		<Component
			className={rootClasses}
			style={{
				backgroundImage:
					isHeaderElement && image_url ? getBackgroundImage(image_url) : undefined,
			}}
			data-testid={isHeaderElement ? "header-image" : "list-item"}
			id={id}
		>
			<div
				className={contentClasses}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				role={default_action?.url ? "link" : undefined}
				aria-label={default_action?.url ? `${titleHtml}. ${opensInNewTabLabel}` : undefined}
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
								button && classes.headerContentWithButton,
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
					dataMessageId={dataMessageId}
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
					dataMessageId={dataMessageId}
					action={shouldBeDisabled ? undefined : action}
					button={button}
					buttonClassName="webchat-list-template-element-button"
					containerClassName={classes.listItemButtonWrapper}
					config={config}
					onEmitAnalytics={onEmitAnalytics}
				/>
			)}
		</Component>
	);
};

export default ListItem;
