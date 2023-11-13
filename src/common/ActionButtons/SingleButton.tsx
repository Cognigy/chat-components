import { FC, HTMLAttributes } from "react";
import classes from "./SingleButton.module.css";
import classnames from "classnames/bind";
import ActionButtons, { ActionButtonsProps } from "./ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client/lib/interfaces/messageData";

interface SingleButtonProps extends HTMLAttributes<HTMLDivElement> {
	action: ActionButtonsProps["action"];
	button: IWebchatButton;
	type: "primary" | "secondary";
	buttonClassName?: string;
	containerClassName?: string;
}

const cx = classnames.bind(classes);

const SingleButton: FC<SingleButtonProps> = props => {
	const { button, containerClassName, buttonClassName, type, action } = props;
	if (!button) return null;

	const buttonClasses = cx(
		{
			primaryButton: type === "primary",
			secondaryButton: type === "secondary",
		},
		buttonClassName,
	);
	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={buttonClasses}
			payload={[button]}
			action={action}
		/>
	);
};

export default SingleButton;
