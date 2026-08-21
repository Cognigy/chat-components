import { FC, ReactElement } from "react";
import classnames from "classnames";
import { ActionButtonsProps } from "./ActionButtons";
import { getWebchatButtonLabel, interpolateString, moveFocusToMessageFocusTarget } from "src/utils";
import { sanitizeHTMLWithConfig } from "src/sanitize";
import { sanitizeUrl } from "@braintree/sanitize-url";
import classes from "./ActionButton.module.css";
import mainClasses from "src/main.module.css";
import { LinkIcon } from "src/assets/svg";
import { MessageProps, Typography } from "src/index";

type NormalizedActionButton = {
	type?: string;
	content_type?: string;
	contentType?: string;
	title?: string;
	payload?: string;
	url?: string;
	target?: string;
	image_url?: string;
	imageUrl?: string;
	image_alt_text?: string;
	imageAltText?: string;
};

interface ActionButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
	action?: ActionButtonsProps["action"];
	className?: string;
	button: ActionButtonsProps["payload"][number] & NormalizedActionButton;
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

	const buttonType = button.type ?? button.content_type ?? button.contentType ?? null;

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
	const customAllowedHtmlTags = config?.settings?.widgetSettings?.customAllowedHtmlTags;
	const __html = config?.settings?.layout?.disableHtmlContentSanitization
		? buttonLabel
		: sanitizeHTMLWithConfig(buttonLabel, customAllowedHtmlTags);

	const isPhoneNumber =
		button.payload && (buttonType === "phone_number" || buttonType === "user_phone_number");
	const isWebURL = "type" in button && button.type === "web_url";
	// Only web_url buttons carry a navigable URL; skip sanitizing (and avoid
	// passing an undefined url into sanitizeUrl) for postback/phone buttons.
	const sanitizedButtonUrl = isWebURL ? sanitizeUrl(button.url) : undefined;
	// Neutralize only dangerous URLs; keep safe URLs byte-identical. sanitizeUrl
	// normalizes safe URLs (adds a trailing slash, lowercases scheme/host), so
	// rendering its output for every href would silently change the rendered
	// markup for consumers (e.g. `https://example.com` -> `https://example.com/`)
	// — a breaking DOM change. `=== "about:blank"` is sanitizeUrl's dangerous-URL
	// signal (it also catches obfuscated payloads like `java\tscript:`, since
	// control chars are stripped before detection), so we only swap in that case.
	const webUrlHref = config?.settings?.layout?.disableUrlButtonSanitization
		? button.url
		: sanitizedButtonUrl === "about:blank"
			? "about:blank"
			: button.url;
	const isWebURLButtonTargetBlank = isWebURL && button.target !== "_self";
	// Whether activating the button opens a new tab — drives the sr-only
	// announcement so it matches real behavior. Both sanitization modes now
	// navigate via window.open, which opens a new tab unless the button
	// targets "_self".
	const opensInNewTab = isWebURLButtonTargetBlank;
	const opensInNewTabLabel =
		config?.settings?.customTranslations?.ariaLabels?.opensInNewTab || "Opens in new tab";

	const positionText =
		total > 1
			? interpolateString(
					config?.settings?.customTranslations?.ariaLabels?.actionButtonPositionText ??
						"{position} of {total}",
					{
						position: position.toString(),
						total: total.toString(),
					},
				) + ": "
			: null;

	const PhoneNumberAnchor = (props: React.HTMLAttributes<HTMLAnchorElement>) =>
		/* eslint-disable-next-line jsx-a11y/anchor-has-content -- render-prop component:
		   the button title always arrives as children via the {...props} spread; the rule
		   cannot see through the indirection. */
		button.payload ? <a {...props} href={`tel:${button.payload}`} /> : null;
	const Anchor = (props: React.HTMLAttributes<HTMLAnchorElement>) =>
		/* eslint-disable-next-line jsx-a11y/anchor-has-content -- same render-prop pattern
		   as PhoneNumberAnchor: children come in via the {...props} spread. */
		isWebURL ? <a {...props} href={webUrlHref} target={button.target} /> : null;
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
			// Both modes navigate via window.open: the opt-out uses the raw URL,
			// the default uses the sanitized value. preventDefault runs first so
			// the anchor's native navigation never fires (a neutralized URL can
			// then no-op without leaking the raw href to the browser).
			const url = config?.settings?.layout?.disableUrlButtonSanitization
				? button.url
				: sanitizedButtonUrl;

			event.preventDefault();

			// A disabled button must not navigate.
			if (disabled) return;

			// prevent no-ops from sending you to a blank page — a neutralized URL,
			// or a missing url on the opt-out path (which would open an empty tab).
			if (!url || url === "about:blank") return;

			// window.open does not inherit the implicit noopener that browsers give
			// <a target="_blank">, so sever window.opener on new-tab navigations to
			// prevent reverse tabnabbing of the host page. Any target other than
			// "_self" opens a new tab (mirrors the rendered anchor's target logic).
			if (isWebURLButtonTargetBlank) {
				window.open(url, "_blank", "noopener");
			} else {
				window.open(url, "_self");
			}
			return;
		}

		if (disabled) return;

		event.preventDefault();

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
			aria-disabled={disabled}
			tabIndex={disabled ? -1 : 0}
		>
			{positionText && <span className={mainClasses.srOnly}>{positionText}</span>}
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
			{opensInNewTab && (
				<span className={mainClasses.srOnly}>{`, ${opensInNewTabLabel}`}</span>
			)}
		</Component>
	);
};

export default ActionButton;
