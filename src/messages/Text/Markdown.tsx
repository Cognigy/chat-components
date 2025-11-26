import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownComponentProps {
	processedContent?: string;
	displayedText?: string;
	className?: string;
}


export const MarkdownComponent: React.FC<MarkdownComponentProps> = props => {
	const { processedContent, displayedText, className } = props;

	return (
		<Markdown
			className={className}
			rehypePlugins={[rehypeRaw]}
			remarkPlugins={[remarkGfm]}
			urlTransform={url => url}
			components={{
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				a: ({ node, ...props }) => <a target="_blank" rel="noreferrer" {...props} />,
			}}
		>
			{processedContent || displayedText}
		</Markdown>
	);
};

export default MarkdownComponent;
