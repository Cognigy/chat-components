import { FC } from "react";
import { useMessageContext } from "src/messages/hooks";
import classes from "./Gallery.module.css";
import classnames from "classnames";
import { getChannelPayload } from "src/utils";

const Gallery: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);

	const { elements, top_element_style, buttons } = payload.message.attachment?.payload || {};

	console.log(elements, top_element_style, buttons);

	return (
		<div
			className={classnames("webchat-list-template-root", classes.wrapper)}
			role="list"
			data-testid="gallery-message"
		>
			Gallery
		</div>
	);
};

export default Gallery;
