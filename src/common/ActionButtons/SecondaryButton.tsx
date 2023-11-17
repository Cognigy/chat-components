import { FC, HTMLAttributes, ReactElement } from "react";
import classes from "./SingleButtons.module.css";
import classnames from "classnames";
import ActionButtons, { ActionButtonsProps } from "./ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client/lib/interfaces/messageData";

interface SecondaryButtonProps extends HTMLAttributes<HTMLDivElement> {
	action?: ActionButtonsProps["action"];
	button: IWebchatButton;
	buttonClassName?: string;
	containerClassName?: string;
	customIcon?: ReactElement;
}

const SecondaryButton: FC<SecondaryButtonProps> = props => {
	const { button, customIcon, containerClassName, buttonClassName, action } = props;
	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={classnames(classes.secondaryButton, buttonClassName)}
			payload={[button]}
			action={action}
			customIcon={customIcon}
			noIcon={!customIcon}
		/>
	);
};

export default SecondaryButton;
