import { FC } from "react";
import classes from "./List.module.css";
import { SingleButton } from "src/common/ActionButtons";
import { useMessageContext } from "src/hooks";
import { getBackgroundImage } from "src/lib/css";
import { useRandomId } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import classnames from "classnames";

const ListRegular: FC<{ element: any }> = props => {
	const { action, config } = useMessageContext();

	const { title, subtitle, image_url, image_alt_text, buttons, default_action } = props.element;

	const button = buttons && buttons[0];

	const subtitleId = useRandomId("webchatListTemplateSubtitle");
	const messengerTitle = title ? title + ". " : "";
	const ariaLabelForTitle = default_action?.url ? messengerTitle + "Opens in new tab" : title;

	const handleKeyDown = (event: any, default_action: any) => {
		if (default_action && event.key === "Enter") {
			action?.(event, default_action);
		}
	};

	const handleClick = () => {
		console.log("click");
	};

	const isSanitizeEnabled = !config?.settings.disableHtmlContentSanitization;

	const titleHtml = isSanitizeEnabled ? sanitizeHTML(title) : title;
	const subtitleHtml = isSanitizeEnabled ? sanitizeHTML(subtitle) : subtitle;

	return (
		<div role="listitem">
			<div
				className={classes.listItemWrapper}
				onClick={default_action && handleClick}
				role={default_action?.url ? "link" : undefined}
				aria-label={ariaLabelForTitle}
				aria-describedby={subtitle ? subtitleId : undefined}
				tabIndex={default_action?.url ? 0 : -1}
				onKeyDown={e => handleKeyDown(e, default_action)}
				style={default_action?.url ? { cursor: "pointer" } : {}}
			>
				<div className={classes.listItemContent}>
					<div
						className={image_url ? classes.listItemTextWithImage : classes.listItemText}
					>
						{titleHtml && (
							<h2
								dangerouslySetInnerHTML={{ __html: titleHtml }}
								className={classnames(
									classes.itemTitle,
									subtitleHtml && classes.itemTitleWithSubtitle,
								)}
							/>
						)}
						{subtitleHtml && (
							<p
								dangerouslySetInnerHTML={{ __html: subtitleHtml }}
								id={subtitleId}
								className={classes.itemSubtitle}
							/>
						)}
					</div>
					{image_url && (
						<div
							className={classes.listItemImage}
							style={{ backgroundImage: getBackgroundImage(image_url) }}
						>
							<span role="img" aria-label={image_alt_text || "Attachment Image"} />
						</div>
					)}
				</div>
			</div>
			<SingleButton
				type="secondary"
				action={action}
				button={button}
				containerClassName={classes.listItemButtonWrapper}
			/>
		</div>
	);
};

export default ListRegular;
