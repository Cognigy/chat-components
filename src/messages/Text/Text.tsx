import { FC } from "react";
import classes from "./Text.module.css";
import ChatBubble from "../../common/ChatBubble";
import { useMessageContext } from "../hooks";
import { replaceUrlsWithHTMLanchorElem } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import classNames from "classnames";
import { useStreamText } from "./hooks";

interface TextProps {
	content?: string;
	className?: string;
	id?: string;
}

// TODO: do we need to handle also "enableGenericHTMLStyling" for Bubble wrapper?

const Text: FC<TextProps> = props => {
	const { message, config } = useMessageContext();
	const text = message?.text;
	const source = message?.source;
	const content = props.content || text || "";
	// const streamingMode = !!config?.settings?.behavior?.streamingMode;
	const streamingMode = true

	const isStreaming = (streamingMode && source === 'bot' && Array.isArray(content))
	const textStates = useStreamText(content, streamingMode, source);

	return (
		<ChatBubble isStreaming={isStreaming}>
			{textStates.map((state, index) => {
				const enhancedURLsText = config?.settings?.widgetSettings?.disableRenderURLsAsLinks
					? state.displayedText
					: replaceUrlsWithHTMLanchorElem(state.displayedText);

				const __html = config?.settings?.layout?.disableHtmlContentSanitization
					? enhancedURLsText
					: sanitizeHTML(enhancedURLsText);

				return (
					<div
						key={index}
						id={`${props?.id}-${index}`}
						className={classNames(classes.text, props?.className)}
						dangerouslySetInnerHTML={{ __html }}
					/>
				);
			})}
		</ChatBubble>
	);
};

export default Text;
