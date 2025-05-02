import { FC } from "react";
import classes from "./ChatEvent.module.css";
import classnames from "classnames";
import Typography from "./Typography/Typography";
import { useLiveRegion, useMessageContext } from "src/messages/hooks";

export interface ChatEventProps {
	text?: string;
	className?: string;
	id?: string;
}

const ChatEvent: FC<ChatEventProps> = props => {
	const { text, className, id } = props;
	const { "data-message-id": dataMessageId } = useMessageContext();

	useLiveRegion({
		messageType: "event",
		data: { dataMessageId },
	});

	return (
		<div className={classnames(classes.eventPill, className)} id={id} aria-live="assertive">
			<div className={classes.eventPillTextWrapper}>
				<Typography variant="title2-semibold" component="div">
					{text}
				</Typography>
			</div>
		</div>
	);
};

export default ChatEvent;
