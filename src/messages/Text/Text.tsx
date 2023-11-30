import { FC } from "react";
import classes from "./Text.module.css";
import ChatBubble from "../../common/ChatBubble";
import { useMessageContext } from "../hooks";
import { replaceUrlsWithHTMLanchorElem } from "src/utils";
import { sanitizeHTML } from "src/sanitize";

interface TextProps {
	content?: string;
}

const Text: FC<TextProps> = props => {
	const { message, config } = useMessageContext();
	const content = props.content || message?.text || "";

	const enhancedURLsText = config?.settings?.disableRenderURLsAsLinks
		? content
		: replaceUrlsWithHTMLanchorElem(content);

	const __html = config?.settings?.disableHtmlContentSanitization
		? enhancedURLsText
		: sanitizeHTML(enhancedURLsText);

	// TODO: do we need to handle also "enableGenericHTMLStyling" for Bubble wrapper?

	return (
		<ChatBubble>
			<div className={classes.text} dangerouslySetInnerHTML={{ __html: __html }}></div>
		</ChatBubble>
	);
};

export default Text;
