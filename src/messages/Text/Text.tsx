import { FC, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { useMessageContext } from "../hooks";
import ChatBubble from "../../common/ChatBubble";
import { replaceUrlsWithHTMLanchorElem } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import { IStreamingMessage } from "../types";
import classes from "./Text.module.css";
import StreamingTextAnimation from "./StreamingTextAnimation";
import Markdown from 'react-markdown'

interface TextProps {
	content?: string | string[];
	className?: string;
	markdownClassName?: string;
	id?: string;
	shouldAnimate?: boolean;
}

const Text: FC<TextProps> = (props) => {
	const { message, config } = useMessageContext();
	const text = message?.text;
	const source = message?.source;
	const content = props.content || text || "";
	const shouldAnimate = props.shouldAnimate || (message as IStreamingMessage)?.shouldAnimate || false;

	const renderMarkdown = config?.settings?.behavior?.renderMarkdown && source === "bot";
	const streamingMode = !!config?.settings?.behavior?.streamingMode;

	const isStreaming = useMemo(
		() => streamingMode && source === "bot" && Array.isArray(content),
		[streamingMode, source, content]
	);

	// Where we accumulate the typed text
	const [displayedText, setDisplayedText] = useState("");

	// If no streaming, just copy the entire text into `displayedText`
	useEffect(() => {
		if (!isStreaming) {
			const newContent = Array.isArray(content) ? content.join("") : content;
			setDisplayedText(newContent);
		}
	}, [content, isStreaming]);

	// Optionally transform URL strings into clickable links
	const enhancedURLsText = config?.settings?.widgetSettings?.disableRenderURLsAsLinks
		? displayedText
		: replaceUrlsWithHTMLanchorElem(displayedText);

	// HTML sanitization as needed
	const __html = config?.settings?.layout?.disableHtmlContentSanitization
		? enhancedURLsText
		: sanitizeHTML(enhancedURLsText);

	return (
		<ChatBubble isStreaming={isStreaming}>
			{/* Accumulated text */}
			{
				renderMarkdown
					?
					<Markdown
						className={classNames(classes.markdown, props?.markdownClassName)}
					>
						{displayedText}
					</Markdown>
					:
					<div
						id={props.id}
						className={classNames(classes.text, props?.className)}
						dangerouslySetInnerHTML={{ __html }}
					/>
			}
			{/* If streaming + animate, show the typed effect */}
			{isStreaming && shouldAnimate && (
				<StreamingTextAnimation
					content={Array.isArray(content) ? content : [content]}
					onTextUpdate={(chunk) =>
						setDisplayedText((prev) => prev + chunk)
					}
				/>
			)}
		</ChatBubble>
	);
};

export default Text;
