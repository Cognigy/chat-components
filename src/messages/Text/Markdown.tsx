import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownComponentProps {
    processedContent?: string;
    displayedText?: string;
    className?: string;
}

const schema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		a: [
			...(defaultSchema.attributes?.a || []),
			["href", /.*/], // allow any href
			["style", /.*/],
		],
	},
	protocols: {
		...defaultSchema.protocols,
		href: [...(defaultSchema.protocols?.href || []), "tel"],
	},
};

export const MarkdownComponent: React.FC<MarkdownComponentProps> = (props) => {
    const { processedContent, displayedText, className } = props;

    return (
        <Markdown
            className={className}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
            remarkPlugins={[remarkGfm]}
            urlTransform={url => url}
            components={{
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                a: ({ node, ...props }) => (
                    <a target="_blank" rel="noreferrer" {...props} />
                ),
            }}
        >
            {processedContent || displayedText}
        </Markdown>
    );
};

export default MarkdownComponent;