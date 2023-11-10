import { FC } from "react";
import classnames from "classnames";

import { ActionButtonsProps } from "./ActionButtons";

import { useMessageContext } from "../../hooks";
import { getWebchatButtonLabel } from "../../utils";
import { sanitizeHTML } from "../../sanitize";
import { sanitizeUrl } from "@braintree/sanitize-url";

import classes from "./ActionButton.module.css";

interface ActionButtonProps extends React.HTMLAttributes<HTMLDivElement> {
	action: ActionButtonsProps["action"];
	className?: string;
	button: ActionButtonsProps["payload"][number];
	total: number;
	position: number;
	disabled?: boolean;
}

/**
 * Postback, phone number, and URL buttons
 */
const ActionButton: FC<ActionButtonProps> = props => {
	const { button, total, position } = props;
	const { config, onEmitAnalytics } = useMessageContext();

	const buttonLabel = getWebchatButtonLabel(button) || "";
	const __html = config?.settings?.disableHtmlContentSanitization
		? buttonLabel
		: sanitizeHTML(buttonLabel);
	const buttonType = (button as any).type || (button as any).content_type;
	const buttonPayload = button.payload;
	const isPhoneNumber = buttonPayload && buttonType === "phone_number";
	const buttonTitle = button.title || "";

	const isWebURLButtonTargetBlank = (button as any).target !== "_self";
	const isWebURL = buttonType === "web_url";

	const buttonTitleWithTarget =
		isWebURL && isWebURLButtonTargetBlank ? buttonTitle + "Opens in new tab" : button.title;
	const ariaLabel =
		total > 1
			? `Item ${position} of ${total}: ${buttonTitleWithTarget}`
			: buttonTitleWithTarget;

	const PhoneNumberAnchor = (props: React.HTMLAttributes<HTMLAnchorElement>) => (
		<a {...props} href={`tel:${buttonPayload}`} />
	);
	const Button = (props: React.HTMLAttributes<HTMLButtonElement>) => <button {...props} />;

	const Component = isPhoneNumber ? PhoneNumberAnchor : Button;

	const onClick = (event: React.MouseEvent) => {
		onEmitAnalytics?.("action", button);

		if (isPhoneNumber) return;

		if (isWebURL) {
			const url = config?.settings?.disableUrlButtonSanitization
				? (button as any).url
				: sanitizeUrl((button as any).url);

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

	return (
		<Component
			onClick={onClick}
			className={classnames(classes.button, isWebURL && classes.url, props.className)}
			dangerouslySetInnerHTML={{ __html }}
			role={isWebURL ? "link" : undefined}
			aria-label={ariaLabel}
		/>
	);
};

export default ActionButton;
