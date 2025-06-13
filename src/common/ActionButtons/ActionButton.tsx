import { FC, ReactElement } from "react";
import classnames from "classnames";
import { ActionButtonsProps } from "./ActionButtons";
import { getWebchatButtonLabel, interpolateString, moveFocusToMessageFocusTarget } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import { sanitizeUrl } from "@braintree/sanitize-url";
import classes from "./ActionButton.module.css";
import { LinkIcon } from "src/assets/svg";
import { MessageProps, Typography } from "src/index";

interface ActionButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
	action?: ActionButtonsProps["action"];
	className?: string;
	button: ActionButtonsProps["payload"][number];
	total: number;
	position: number;
	disabled?: boolean;
	customIcon?: ReactElement;
	showUrlIcon?: boolean;
	config: MessageProps["config"];
	dataMessageId?: string;
	onEmitAnalytics: MessageProps["onEmitAnalytics"];
	size?: "small" | "large";
	openXAppOverlay?: (url: string | undefined) => void;
}

/**
 * Postback, phone number, and URL buttons
 */
const ActionButton: FC<ActionButtonProps> = props => {
	const {
		button,
		disabled,
		total,
		position,
		showUrlIcon,
		customIcon,
		config,
		onEmitAnalytics,
		size,
		openXAppOverlay,
		dataMessageId,
	} = props;

	const buttonType =
		"type" in button
			? button.type
			: "content_type" in button
				? button.content_type
				: "contentType" in button
					? (button as any).contentType
					: null;

	const buttonImage =
		"image_url" in button ? button.image_url : "imageUrl" in button ? button.imageUrl : null;
	const buttonImageAltText =
		"image_alt_text" in button
			? button.image_alt_text
			: "imageAltText" in button
				? button.imageAltText
				: "";

	if (!buttonType) return null;

	const buttonLabel = getWebchatButtonLabel(button) || "";
	const __html = config?.settings?.layout?.disableHtmlContentSanitization
		? buttonLabel
		: sanitizeHTML(buttonLabel);

	const isPhoneNumber =
		button.payload && (buttonType === "phone_number" || buttonType === "user_phone_number");
	const buttonTitle = button.title || "";

	const isWebURL = "type" in button && button.type === "web_url";
	const isWebURLButtonTargetBlank = isWebURL && button.target !== "_self";
	const opensInNewTabLabel =
		config?.settings?.customTranslations?.ariaLabels?.opensInNewTab || "Opens in new tab";

	const getAriaLabel = () => {
		const isURLInNewTab = isWebURL && isWebURLButtonTargetBlank;
		const newTabURLButtonTitle = `${buttonTitle}. ${opensInNewTabLabel}`;
		const buttonTitleWithTarget = isURLInNewTab ? newTabURLButtonTitle : button.title;

		if (total > 1) {
			return (
				interpolateString(
					config?.settings?.customTranslations?.ariaLabels?.actionButtonPositionText ??
						"{position} of {total}",
					{
						position: position.toString(),
						total: total.toString(),
					},
				) +
				": " +
				buttonTitleWithTarget
			);
		} else if (total <= 1 && isURLInNewTab) {
			return newTabURLButtonTitle;
		}
	};

	const PhoneNumberAnchor = (props: React.HTMLAttributes<HTMLAnchorElement>) =>
		button.payload ? <a {...props} href={`tel:${button.payload}`} /> : null;
	const Anchor = (props: React.HTMLAttributes<HTMLAnchorElement>) =>
		isWebURL ? <a {...props} href={button.url} target={button.target} /> : null;
	const Button = (props: React.HTMLAttributes<HTMLButtonElement>) => (
		<button {...props} disabled={disabled} />
	);

	const isURLComponent = isWebURL || isPhoneNumber;
	const URLComponent = isPhoneNumber ? PhoneNumberAnchor : Anchor;
	const Component = isURLComponent ? URLComponent : Button;

	const onClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		onEmitAnalytics?.("action", button);

		if (isPhoneNumber) {
			if (disabled) {
				event.preventDefault();
			}

			return;
		}

		if (isWebURL) {
			const url = config?.settings?.layout?.disableUrlButtonSanitization
				? button.url
				: sanitizeUrl(button.url);

			// prevent no-ops from sending you to a blank page
			if (url === "about:blank") return;
			window.open(url, isWebURLButtonTargetBlank ? "_blank" : "_self");
		}

		if (disabled) return;

		event.preventDefault();

		if (isWebURL) {
			return;
		}

		if (buttonType === "openXApp") {
			openXAppOverlay?.(button.payload);
			return;
		}

		props.action?.(button.payload, null, { label: button.title });

		focusHandling();
	};

	const focusHandling = () => {
		// Focus the input after postback button click, if focusInputAfterPostback is true
		if (config?.settings?.behavior?.focusInputAfterPostback) {
			const textMessageInput = document.getElementById("webchatInputMessageInputInTextMode");
			textMessageInput?.focus?.();
			return;
		}
		// Focus the visually hidden focus target after postback, if focusInputAfterPostback is false
		if (dataMessageId) {
			moveFocusToMessageFocusTarget(dataMessageId);
		}
	};

	const renderIcon = () => {
		if (customIcon) return customIcon;
		if (isWebURL && showUrlIcon) return <LinkIcon />;
		return null;
	};

	return (
		<Component
			onClick={onClick}
			className={classnames(
				classes.button,
				isWebURL && classes.url,
				props.className,
				disabled && classes.disabled,
				disabled && "disabled",
				isPhoneNumber && "phone-number-or-url-anchor",
				isWebURL && "phone-number-or-url-anchor",
			)}
			aria-label={getAriaLabel()}
			aria-disabled={disabled}
			tabIndex={disabled ? -1 : 0}
		>
			{!!buttonImage && (
				<div className={classes.buttonImageContainer}>
					<img
						src={buttonImage as string}
						alt={buttonImageAltText as string}
						className={classnames(
							"webchat-template-button-image",
							classes.buttonImage,
							disabled && classes.imageDisabled,
						)}
					/>
				</div>
			)}
			<Typography
				variant={size === "large" ? "title1-semibold" : "cta-semibold"}
				component="span"
				dangerouslySetInnerHTML={{ __html }}
				className={!!buttonImage && classes.buttonLabelWithImage}
			/>
			{renderIcon()}
		</Component>
	);
};

export default ActionButton;
