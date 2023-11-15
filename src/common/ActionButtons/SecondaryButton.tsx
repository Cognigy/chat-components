import { FC, HTMLAttributes } from "react";
import classes from "./SingleButtons.module.css";
import classnames from "classnames";
import ActionButtons, { ActionButtonsProps } from "./ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client/lib/interfaces/messageData";

interface SecondaryButtonProps extends HTMLAttributes<HTMLDivElement> {
	action: ActionButtonsProps["action"];
	button: IWebchatButton;
	buttonClassName?: string;
	containerClassName?: string;
}

const SecondaryButton: FC<SecondaryButtonProps> = props => {
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

export default SecondaryButton;
