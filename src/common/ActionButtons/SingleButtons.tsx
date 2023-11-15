import { FC, HTMLAttributes, ReactElement } from "react";
import classes from "./SingleButtons.module.css";
import classnames from "classnames";
import ActionButtons, { ActionButtonsProps } from "./ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client/lib/interfaces/messageData";

interface SingleButtonProps extends HTMLAttributes<HTMLDivElement> {
	action?: ActionButtonsProps["action"];
	button: IWebchatButton;
	buttonClassName?: string;
	containerClassName?: string;
	icon?: ReactElement;
}

const PrimaryButton: FC<SingleButtonProps> = props => {
	const { button, containerClassName, buttonClassName, action, icon } = props;
	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={classnames(classes.primaryButton, buttonClassName)}
			payload={[button]}
			action={action}
			icon={icon}
		/>
	);
};

const SecondaryButton: FC<SingleButtonProps> = props => {
	const { button, containerClassName, buttonClassName, action, icon } = props;
	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={classnames(classes.secondaryButton, buttonClassName)}
			payload={[button]}
			action={action}
			icon={icon}
		/>
	);
};

export { PrimaryButton, SecondaryButton };
