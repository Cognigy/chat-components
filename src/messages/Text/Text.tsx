import { FC } from "react";
import classes from "./Text.module.css";

import ChatBubble from "../../common/ChatBubble";
import { useMessageContext } from "../../hooks";

interface TextProps {
	content?: string;
}

const Text: FC<TextProps> = props => {
	const { message } = useMessageContext();
	const content = props.content || message?.text || "";

	return (
		<ChatBubble>
			<div className={classes.text} dangerouslySetInnerHTML={{ __html: content }}></div>
		</ChatBubble>
	);
};

export default Text;
