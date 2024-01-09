import { FC } from "react";
import classes from "./ChatEvent.module.css";
import classnames from "classnames";
import Typography from "./Typography/Typography";

export interface ChatEventProps {
	text?: string;
	className?: string;
	id?: string;
}

const ChatEvent: FC<ChatEventProps> = props => {
	const { text, className, id } = props;

	return (
		<div className={classnames(classes.eventPill, className)} id={id}>
			<div className={classes.eventPillTextWrapper}>
				<Typography variant="title2-semibold" component="div">
					{text}
				</Typography>
			</div>
		</div>
	);
};

export default ChatEvent;
