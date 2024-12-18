import { FC } from "react";
import classes from "./Text.module.css";
import ChatBubble from "../../common/ChatBubble";
import { useMessageContext } from "../hooks";
import { replaceUrlsWithHTMLanchorElem } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import classNames from "classnames";

interface TextProps {
	content?: string;
	className?: string;
	id?: string;
}

const Text: FC<TextProps> = props => {
	const { message, config } = useMessageContext();
	const text = message?.text?.toString();
	const content = props.content || text || "";

	const enhancedURLsText = config?.settings?.widgetSettings?.disableRenderURLsAsLinks
		? content
		: replaceUrlsWithHTMLanchorElem(content);

	const __html = config?.settings?.layout?.disableHtmlContentSanitization
		? enhancedURLsText
		: sanitizeHTML(enhancedURLsText);

	// TODO: do we need to handle also "enableGenericHTMLStyling" for Bubble wrapper?

	return (
		<ChatBubble>
			<div
				id={props?.id}
				className={classNames(classes.text, props?.className)}
				dangerouslySetInnerHTML={{ __html: __html }}
			/>
		</ChatBubble>
	);
};

export default Text;
