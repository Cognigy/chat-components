import { FC } from "react";
import classnames from "classnames";

import { ActionButtonsProps } from "./ActionButtons";

import { useMessageContext } from "../../hooks";
import { getWebchatButtonLabel } from "../../utils";
import { sanitizeHTML } from "../../sanitize";

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
	const { config } = useMessageContext();

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

	const A = (props: React.HTMLAttributes<HTMLAnchorElement>) => <a {...props} />;
	const Button = (props: React.HTMLAttributes<HTMLButtonElement>) => <button {...props} />;

	const Component = isPhoneNumber ? (A as any) : Button;

	const onClick = (event: React.MouseEvent) => {
		if (isPhoneNumber) return;

		if (isWebURL) {
			window.open((button as any).url, isWebURLButtonTargetBlank ? "_blank" : "_self");
			return;
		}

		if (props.disabled) return;

		event.preventDefault();
		props.action?.({ data: button });
	};

	return (
		<Component
			onClick={onClick}
			className={classnames(classes.button, isWebURL && classes.url, props.className)}
			dangerouslySetInnerHTML={{ __html }}
			role={isWebURL ? "link" : undefined}
			aria-label={ariaLabel}
			href={isPhoneNumber ? `tel:${buttonPayload}` : undefined}
		/>
	);
};

export default ActionButton;
