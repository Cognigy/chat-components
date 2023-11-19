import { FC, ReactElement } from "react";
import classnames from "classnames";
import { ActionButtonsProps } from "./ActionButtons";
import { useMessageContext } from "src/messages/hooks";
import { getWebchatButtonLabel } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import { sanitizeUrl } from "@braintree/sanitize-url";
import classes from "./ActionButton.module.css";
import { LinkIcon } from "src/assets/svg";

interface ActionButtonProps extends React.HTMLAttributes<HTMLDivElement> {
	action?: ActionButtonsProps["action"];
	className?: string;
	button: ActionButtonsProps["payload"][number];
	total: number;
	position: number;
	disabled?: boolean;
	customIcon?: ReactElement;
	noIcon?: boolean;
}

/**
 * Postback, phone number, and URL buttons
 */
const ActionButton: FC<ActionButtonProps> = props => {
	const { button, total, position, noIcon, customIcon } = props;
	const { config, onEmitAnalytics } = useMessageContext();

	const buttonType =
		"type" in button ? button.type : "content_type" in button ? button.content_type : null;
	if (!buttonType) return null;

	const buttonLabel = getWebchatButtonLabel(button) || "";
	const __html = config?.settings?.disableHtmlContentSanitization
		? buttonLabel
		: sanitizeHTML(buttonLabel);

	const isPhoneNumber = button.payload && buttonType === "phone_number";
	const buttonTitle = button.title || "";

	const isWebURL = "type" in button && button.type === "web_url";
	const isWebURLButtonTargetBlank = isWebURL && button.target !== "_self";

	const buttonTitleWithTarget =
		isWebURL && isWebURLButtonTargetBlank ? `${buttonTitle} Opens in new tab` : button.title;

	const ariaLabel =
		total > 1
			? `Item ${position} of ${total}: ${buttonTitleWithTarget}`
			: buttonTitleWithTarget;

	const PhoneNumberAnchor = (props: React.HTMLAttributes<HTMLAnchorElement>) =>
		button.payload ? <a {...props} href={`tel:${button.payload}`} /> : null;
	const Button = (props: React.HTMLAttributes<HTMLButtonElement>) => <button {...props} />;

	const Component = isPhoneNumber ? PhoneNumberAnchor : Button;

	const onClick = (event: React.MouseEvent) => {
		event.stopPropagation();
		onEmitAnalytics?.("action", button);

		if (isPhoneNumber) return;

		if (isWebURL) {
			const url = config?.settings?.disableUrlButtonSanitization
				? button.url
				: sanitizeUrl(button.url);

			// prevent no-ops from sending you to a blank page
			if (url === "about:blank") return;
			window.open(url, isWebURLButtonTargetBlank ? "_blank" : "_self");
			return;
		}

		if (props.disabled) return;

		event.preventDefault();

		const textMessageInput = document.getElementById("webchatInputMessageInputInTextMode");
		if (textMessageInput && config?.settings?.focusInputAfterPostback)
			textMessageInput.focus?.();

		props.action?.(button.payload, null, { label: button.title });
	};

	const renderIcon = () => {
		if (noIcon) return null;
		if (customIcon) return customIcon;
		if (isWebURL) return <LinkIcon />;
		return null;
	};

	return (
		<Component
			onClick={onClick}
			className={classnames(classes.button, isWebURL && classes.url, props.className)}
			role={isWebURL ? "link" : undefined}
			aria-label={ariaLabel}
		>
			<span dangerouslySetInnerHTML={{ __html }} />
			{renderIcon()}
		</Component>
	);
};

export default ActionButton;
