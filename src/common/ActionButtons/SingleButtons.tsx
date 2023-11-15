import { FC, HTMLAttributes } from "react";
import classes from "./SingleButtons.module.css";
import classnames from "classnames";
import ActionButtons, { ActionButtonsProps } from "./ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client/lib/interfaces/messageData";

interface SingleButtonProps extends HTMLAttributes<HTMLDivElement> {
	action: ActionButtonsProps["action"];
	button: IWebchatButton;
	buttonClassName?: string;
	containerClassName?: string;
}

const PrimaryButton: FC<SingleButtonProps> = props => {
	const { button, containerClassName, buttonClassName, action } = props;
	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={classnames(classes.primaryButton, buttonClassName)}
			payload={[button]}
			action={action}
		/>
	);
};

const SecondaryButton: FC<SingleButtonProps> = props => {
	const { button, containerClassName, buttonClassName, action } = props;
	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={classnames(classes.secondaryButton, buttonClassName)}
			payload={[button]}
			action={action}
		/>
	);
};

export { PrimaryButton, SecondaryButton };
