import { FC } from "react";
import classes from "./TypingIndicator.module.css";
import classnames from "classnames";

interface ITypingIndicator {
	className?: string;
}

const TypingIndicator: FC<ITypingIndicator> = props => {
	const classNames = classnames(
		classes.typingIndicator,
		props.className,
		"webchat-typing-indicator",
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
