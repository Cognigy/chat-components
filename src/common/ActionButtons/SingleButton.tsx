
import { FC, HTMLAttributes } from "react";
import classes from "./SingleButton.module.css";
import classnames from "classnames/bind";
import ActionButtons, { ActionButtonsProps } from "./ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client/lib/interfaces/messageData";

interface SingleButtonProps extends HTMLAttributes<HTMLDivElement> {
	action: ActionButtonsProps["action"];
	button: IWebchatButton;
	type: "primary" | "secondary";
	containerClassName?: string;
}

const cx = classnames.bind(classes);

const SingleButton: FC<SingleButtonProps> = props => {
	const {button, containerClassName, type, action} = props
	if (!button) return null;

	const buttonClass = cx({
		primaryButton: type === "primary",
		secondaryButton: type === "secondary",
	});
	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={buttonClass}
			payload={[button]}
			action={action}
		/>
	);
};

export default SingleButton;
