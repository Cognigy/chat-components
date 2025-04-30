import { FC, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { useMessageContext } from "../hooks";
import ChatBubble from "../../common/ChatBubble";
import { replaceUrlsWithHTMLanchorElem } from "src/utils";
import { sanitizeHTML } from "src/sanitize";
import { IStreamingMessage } from "../types";
import classes from "./Text.module.css";
import StreamingTextAnimation from "./StreamingTextAnimation";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface TextProps {
	content?: string | string[];
	className?: string;
	markdownClassName?: string;
	id?: string;
	onSetMessageAnimated?: (
		messageId: string,
		animationState: IStreamingMessage["animationState"],
	) => void;
	onSetScreenReaderBtnLabel?: (text: string) => void;
}

const Text: FC<TextProps> = props => {
	const { message, config, onSetLiveRegionText } = useMessageContext();
	const { onSetScreenReaderBtnLabel } = props;
	const text = message?.text;
	const source = message?.source;
	const content = props.content || text || "";
	const shouldAnimate =
		(message as IStreamingMessage)?.animationState === "start" ||
		(message as IStreamingMessage)?.animationState === "animating" ||
		false;

	const previousLiveContentRef = useRef<string | undefined>(undefined);

	const renderMarkdown =
		config?.settings?.behavior?.renderMarkdown && (source === "bot" || source === "engagement");
	const progressiveMessageRendering = !!config?.settings?.behavior?.progressiveMessageRendering;

	const isStreaming = useMemo(
		() =>
			progressiveMessageRendering && (source === "bot" || source === "engagement") && content,
		[progressiveMessageRendering, source, content],
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

	useEffect(() => {
		if (onSetScreenReaderBtnLabel) {
			onSetScreenReaderBtnLabel(__html);
		} else if (onSetLiveRegionText && __html && __html !== previousLiveContentRef.current) {
			onSetLiveRegionText(__html);
			previousLiveContentRef.current = __html;
		}
	}, [__html, onSetLiveRegionText, onSetScreenReaderBtnLabel]);

	return (
		<ChatBubble>
			{/* Accumulated text */}
			{renderMarkdown ? (
				<Markdown
					className={classNames(classes.markdown, props?.markdownClassName)}
					rehypePlugins={[rehypeRaw]}
					remarkPlugins={[remarkGfm]}
					components={{
						a: props => <a target="_blank" rel="noreferrer" {...props} />,
					}}
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
					finishReason={(message as IStreamingMessage)?.finishReason}
				/>
			)}
		</ChatBubble>
	);
};

export default Text;
