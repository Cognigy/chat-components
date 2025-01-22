import { FC, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { useMessageContext } from "../hooks";
import ChatBubble from "../../common/ChatBubble";
import { replaceUrlsWithHTMLanchorElem } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import { IStreamingMessage } from "../types";
import classes from "./Text.module.css";
import StreamingTextAnimation from "./StreamingTextAnimation";
import Markdown from "react-markdown";
import rehypeRaw from 'rehype-raw'

interface TextProps {
	content?: string | string[];
	className?: string;
	markdownClassName?: string;
	id?: string;
	onSetMessageAnimated?: (
		messageId: string,
		animationState: IStreamingMessage["animationState"],
	) => void;
}

const Text: FC<TextProps> = props => {
	const { message, config } = useMessageContext();
	const text = message?.text;
	const source = message?.source;
	const content = props.content || text || "";
	const shouldAnimate =
		(message as IStreamingMessage)?.animationState === "start" ||
		(message as IStreamingMessage)?.animationState === "animating" ||
		false;

	const renderMarkdown =
		config?.settings?.behavior?.renderMarkdown && (source === "bot" || source === "engagement");
	const streamingMode = !!config?.settings?.behavior?.streamingMode;

	const isStreaming = useMemo(
		() => streamingMode && (source === "bot" || source === "engagement") && content,
		[streamingMode, source, content],
	);

	// Where we accumulate the typed text
	const [displayedText, setDisplayedText] = useState("");

	// If no streaming, just copy the entire text into `displayedText`
	useEffect(() => {
		if (
			!isStreaming ||
			(message as IStreamingMessage)?.animationState === "exited" ||
			(message as IStreamingMessage)?.animationState === "done"
		) {
			const newContent = Array.isArray(content) ? content.join("") : content;
			setDisplayedText(newContent);
		}
	}, [content, isStreaming, message]);

	// Optionally transform URL strings into clickable links
	const enhancedURLsText = config?.settings?.widgetSettings?.disableRenderURLsAsLinks
		? displayedText
		: replaceUrlsWithHTMLanchorElem(displayedText);

	// HTML sanitization as needed
	const __html = config?.settings?.layout?.disableHtmlContentSanitization
		? enhancedURLsText
		: sanitizeHTML(enhancedURLsText);

	return (
		<ChatBubble>
			{/* Accumulated text */}
			{renderMarkdown ? (
				<Markdown
					className={classNames(classes.markdown, props?.markdownClassName)}
					rehypePlugins={[rehypeRaw]}
				>
					{displayedText}
				</Markdown>
			) : (
				<div
					id={props.id}
					className={classNames(classes.text, props?.className)}
					dangerouslySetInnerHTML={{ __html }}
				/>
			)}
			{/* If streaming + animate, show the typed effect */}
			{isStreaming && shouldAnimate && message.id && (
				<StreamingTextAnimation
					content={Array.isArray(content) ? content : [content]}
					onTextUpdate={chunk => setDisplayedText(prev => prev + chunk)}
					onSetMessageAnimated={props.onSetMessageAnimated}
					animationState={(message as IStreamingMessage)?.animationState}
					messageId={message.id}
				/>
			)}
		</ChatBubble>
	);
};

export default Text;
