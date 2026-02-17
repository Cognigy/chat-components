import { FC, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { useLiveRegion, useMessageContext } from "../hooks";
import ChatBubble from "../../common/ChatBubble";
import { replaceUrlsWithHTMLanchorElem } from "src/utils";
import { useSanitize } from "src/sanitize";
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
	ignoreLiveRegion?: boolean;
}

const Text: FC<TextProps> = props => {
	const { message, config } = useMessageContext();
	const { processHTML } = useSanitize();

	const text = message?.text;
	const source = message?.source;
	let content = props.content || text || "";

	const collateStreamedOutputs = config?.settings?.behavior?.collateStreamedOutputs;
	const shouldTrimLeadingSpaces =
		!collateStreamedOutputs && (source === "bot" || source === "engagement");

	content = shouldTrimLeadingSpaces
		? Array.isArray(content)
			? content.map(c => c.trimStart())
			: content.trimStart()
		: content;

	const shouldAnimate =
		(message as IStreamingMessage)?.animationState === "start" ||
		(message as IStreamingMessage)?.animationState === "animating" ||
		false;

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

	const ignoreSanitization =
		source === "user" && config?.settings?.widgetSettings?.disableTextInputSanitization;

	// HTML sanitization as needed
	const processedContent = ignoreSanitization ? enhancedURLsText : processHTML(enhancedURLsText);

	useLiveRegion({
		messageType: "text",
		data: { text: processedContent },
		validation: () => !props.ignoreLiveRegion,
	});

	return (
		<ChatBubble>
			{/* Accumulated text */}
			{renderMarkdown ? (
				<Markdown
					className={classNames(classes.markdown, props?.markdownClassName)}
					rehypePlugins={[rehypeRaw]}
					remarkPlugins={[remarkGfm]}
					urlTransform={url => url}
					components={{
						a: ({ node: _node, ...props }) => (
							<a target="_blank" rel="noreferrer" {...props} />
						),
						p: ({ node: _node, children, ...props }) => (
							<p {...props}>
								{/* The extra span is a workaround for the crash caused by google translate issue in React applications.
								    See https://github.com/facebook/react/issues/11538 for more details.
								*/}
								<span style={{ display: "contents" }}>{children}</span>
							</p>
						),
					}}
				>
					{processedContent || displayedText}
				</Markdown>
			) : (
				<p
					id={props.id}
					className={classNames(classes.text, props?.className)}
					dangerouslySetInnerHTML={{ __html: processedContent }}
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
