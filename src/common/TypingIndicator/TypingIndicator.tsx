import { FC } from "react";
import classes from "./TypingIndicator.module.css";
import classnames from "classnames";
import { TSourceDirection } from "src/messages/types";

interface ITypingIndicator {
	className?: string;
	direction?: TSourceDirection;
	disableBorder?: boolean;
}

const TypingIndicator: FC<ITypingIndicator> = props => {
	const classNames = classnames(
		classes.typingIndicator,
		props.className,
		"webchat-typing-indicator",
		props.direction && classes[props.direction],
		props.disableBorder && classes.disableBorder,
	);

	return (
		<div className={classNames}>
			<div className={classes.dot}></div>
			<div className={classes.dot}></div>
			<div className={classes.dot}></div>
		</div>
	);
};

export default TypingIndicator;
