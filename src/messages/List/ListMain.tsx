import { FC } from "react";
import classes from "./List.module.css";
import { useMessageContext } from "src/hooks";
import { sanitizeHTML } from "src/sanitize";
import { useRandomId } from "src/utils";
import { getBackgroundImage } from "src/lib/css";
import { SingleButton } from "src/common/ActionButtons";

const ListMain: FC<{ element: any }> = props => {
	const { action, config } = useMessageContext();

	const { title, subtitle, image_url, image_alt_text, default_action, buttons } = props.element;
	console.log("ListMain", default_action);

	const button = buttons && buttons[0];
	const headerTitle = title ? title + ". " : "";
	const ariaLabelForTitle = default_action?.url ? headerTitle + "Opens in new tab" : title;
	const subtitleId = useRandomId("webchatListTemplateHeaderSubtitle");

	const handleKeyDown = (event, default_action) => {
		if (default_action && event.key === "Enter") {
			action?.(event, default_action);
		}
	};

	const handleClick = () => {
		console.log("click");
	};

	const isSanitizeEnabled = !config?.settings?.disableHtmlContentSanitization;

	const titleHtml = isSanitizeEnabled ? sanitizeHTML(title) : title;
	const subtitleHtml = isSanitizeEnabled ? sanitizeHTML(subtitle) : subtitle;

	const backgroundImage = getBackgroundImage(image_url);

	return (
		<div role="listitem">
			<div
				className={classes.headerWrapper}
				onClick={default_action && handleClick}
				role={default_action?.url ? "link" : undefined}
				aria-label={ariaLabelForTitle}
				aria-describedby={subtitle ? subtitleId : undefined}
				tabIndex={default_action?.url ? 0 : -1}
				onKeyDown={e => handleKeyDown(e, default_action)}
				style={default_action?.url ? { cursor: "pointer" } : {}}
			>
				<div className={classes.headerImage} style={{ backgroundImage: backgroundImage }}>
					<span role="img" aria-label={image_alt_text || "Attachment Image"} />
				</div>
				<div className={classes.darkLayer} />
				<div className={classes.headerContent}>
					<h2
						dangerouslySetInnerHTML={{ __html: titleHtml }}
						className={classes.headerTitle}
					/>
					<p
						dangerouslySetInnerHTML={{ __html: subtitleHtml }}
						id={subtitleId}
						className={classes.headerSubtitle}
					/>
					<SingleButton type="primary" action={action} button={button} />
				</div>
			</div>
		</div>
	);
};

export default ListMain;
