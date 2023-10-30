import { FC } from "react";
import { MessagePasstroughProps } from "../types";

const Text: FC<MessagePasstroughProps> = props => {
	const content = props.message.text;

	return <div dangerouslySetInnerHTML={{ __html: content }}></div>;
};

export default Text;
