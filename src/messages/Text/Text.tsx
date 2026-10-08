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
import remend from "remend";

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

const stripTrailingMarkdownDelimiter = (text: string) => {
	const delimiter = text.at(-1);
	if (!delimiter || !"*_~`<".includes(delimiter)) return text;

	let start = text.length - 1;
	if (delimiter !== "<") {
		while (start > 0 && text[start - 1] === delimiter) start--;
	}
	if (text[start - 1] === "\\") start++;

	return text.slice(0, start);
};

const getOpenCode = (text: string) => {
	let inlineRun = 0;
	let fenced = false;

	for (let index = 0; index < text.length; index++) {
		if (text[index] === "\\") {
			index++;
			continue;
		}
		if (text[index] !== "`") continue;

		let end = index + 1;
		while (text[end] === "`") end++;
		const length = end - index;
		if (length === 3 && inlineRun === 0) {
			fenced = !fenced;
		} else if (!fenced) {
			if (inlineRun === length) inlineRun = 0;
			else if (inlineRun === 0) inlineRun = length;
		}
		index = end - 1;
	}

	return { inlineRun, inCode: fenced || inlineRun > 0 };
};

const getTrailingBareUrl = (text: string) => {
	let start = text.length;
	while (start > 0 && !/\s/u.test(text[start - 1])) start--;
	while ("*_~".includes(text[start])) start++;
	const tail = text.slice(start);
	return /^https?:\/\//iu.test(tail) ? tail : undefined;
};

const completeStreamingMarkdown = (text: string) => {
	// An unfinished link label, block marker, or bare delimiter cannot be
	// resolved until more text arrives; leave the completed message untouched.
	let withoutPendingSyntax = stripTrailingMarkdownDelimiter(
		text
			.replace(/(?<!\\)(!?)\[([^[\]]*)\]$/u, (_match, image: string, label: string) =>
				image ? "" : label,
			)
			.replace(/(^|\n)[ \t]*(?:#{1,6}|[-+*]|>{1,3}|\d+[.)])[ \t]*$/u, "$1"),
	).replace(/(?<!\\)(?:\\\\)*\\$/u, match => match.slice(0, -1));

	const { inlineRun, inCode } = getOpenCode(withoutPendingSyntax);
	const pendingUrl = inCode ? undefined : getTrailingBareUrl(withoutPendingSyntax);
	if (inlineRun) withoutPendingSyntax += "`".repeat(inlineRun);

	return { text: remend(withoutPendingSyntax, { linkMode: "text-only" }), pendingUrl };
};

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
			? content.map((c, index) => (index === 0 ? c.trimStart() : c))
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
	const [typingText, setTypingText] = useState("");

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
	const processedContent = useMemo(
		() => (ignoreSanitization ? enhancedURLsText : processHTML(enhancedURLsText)),
		[enhancedURLsText, ignoreSanitization, processHTML],
	);

	useLiveRegion({
		messageType: "text",
		data: { text: processedContent },
		validation: () => !props.ignoreLiveRegion,
	});

	// Keep the live-region text based on completed chunks, but render the growing
	// markdown prefix so formatting is visible while the current chunk is typed.
	const fullText = Array.isArray(content) ? content.join("") : content;
	const finishedTyping =
		!!(message as IStreamingMessage)?.finishReason && displayedText === fullText && !typingText;
	const streamingMarkdown =
		renderMarkdown && isStreaming && shouldAnimate && !finishedTyping
			? completeStreamingMarkdown(displayedText + typingText)
			: undefined;
	const pendingUrlStart =
		streamingMarkdown?.pendingUrl === undefined
			? -1
			: streamingMarkdown.text.lastIndexOf(streamingMarkdown.pendingUrl);
	const markdownContent =
		streamingMarkdown === undefined
			? processedContent || displayedText
			: processHTML(
					config?.settings?.widgetSettings?.disableRenderURLsAsLinks
						? streamingMarkdown.text
						: pendingUrlStart < 0
							? replaceUrlsWithHTMLanchorElem(streamingMarkdown.text)
							: replaceUrlsWithHTMLanchorElem(
									streamingMarkdown.text.slice(0, pendingUrlStart),
								) + streamingMarkdown.text.slice(pendingUrlStart),
				);
	const pendingUrlOffset =
		pendingUrlStart < 0 || !streamingMarkdown?.pendingUrl
			? -1
			: markdownContent.lastIndexOf(
					streamingMarkdown.pendingUrl.slice(
						0,
						streamingMarkdown.pendingUrl.indexOf("://") + 3,
					),
				);

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
						a: ({ node, children, ...props }) =>
							node?.position?.start.offset === pendingUrlOffset &&
							pendingUrlOffset >= 0 ? (
								<>{children}</>
							) : (
								<a target="_blank" rel="noreferrer" {...props}>
									{children}
								</a>
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
					{markdownContent}
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
					onTypingTextUpdate={renderMarkdown ? setTypingText : undefined}
					renderTypingText={!renderMarkdown}
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
