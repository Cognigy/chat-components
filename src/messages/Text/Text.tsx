import { FC } from "react";
import { MessagePasstroughProps } from "../types";
import ChatBubble from "src/common/ChatBubble";

const Text: FC<MessagePasstroughProps> = props => {
	const content = props.message.text;

	return (
		<ChatBubble>
			<div dangerouslySetInnerHTML={{ __html: content }}></div>
		</ChatBubble>
	);
};

export default Text;
