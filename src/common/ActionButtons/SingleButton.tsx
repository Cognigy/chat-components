import { ActionButton } from ".";
import { FC } from "react";
import classes from './SingleButton.module.css';
import classnames from "classnames/bind";
import { ActionButtonsProps } from "./ActionButtons";

interface SingleButtonProps extends React.HTMLAttributes<HTMLDivElement> {
	action: ActionButtonsProps["action"];
	button: ActionButtonsProps["payload"][number];
	type: "primary" | "secondary";
}

const cx = classnames.bind(classes);

const SingleButton: FC<SingleButtonProps> = props => {
	const buttonClass = cx({
		primaryButton: props.type === "primary",
		secondaryButton: props.type === "secondary",
	})
	return (
		<ActionButton
			className={buttonClass}
			button={props.button}
			action={props.action}
			position={1}
			total={1}
			disabled={props.action === undefined}
		/>
	);
};

export default SingleButton;