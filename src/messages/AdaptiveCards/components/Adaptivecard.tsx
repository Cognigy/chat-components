import { FC, useEffect, useRef, useState } from "react";
import { Action, AdaptiveCard as MSAdaptiveCard, HostConfig } from "adaptivecards";
import { Remarkable } from "remarkable";
import { useSanitize } from "../../../sanitize.ts";
import { useLiveRegion } from "src/messages/hooks.ts";

interface IAdaptiveCardProps {
	hostConfig?: Partial<HostConfig>;
	onExecuteAction?: (acion: Action) => void;
	payload?: boolean;
}

// it's designed to be used as a signleton instance, following their documentation
const md = new Remarkable();

/**
 * Inspired by Microsoft's (not publically released) adaptivecards-react package
 * https://github.com/microsoft/AdaptiveCards/blob/5b66a52e0e0cee5074a42dcbe688d608e0327ae4/source/nodejs/adaptivecards-react/src/adaptive-card.tsx
 */
const AdaptiveCard: FC<IAdaptiveCardProps> = props => {
	const { payload, hostConfig, onExecuteAction } = props;

	const targetRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<MSAdaptiveCard>(new MSAdaptiveCard());
	const [speakText, setSpeakText] = useState<string | undefined>(undefined);

	const { sanitizeHTML } = useSanitize();

	// Set up the markdown processing with access to config
	useEffect(() => {
		/**
		 * Manually add Support for rending Markdown, as described here:
		 * https://www.npmjs.com/package/adaptivecards#user-content-option-2-any-other-3rd-party-library
		 *
		 * We went for "remarkable" over the suggested "markdown-it", because
		 * - it has a smaller footprint
		 * - it supports all standard features
		 * - we already do have our own "sanitizing" approach which we can reuse here
		 */
		MSAdaptiveCard.onProcessMarkdown = (text, result) => {
			const html = md.render(text);
			const saneHtml = sanitizeHTML(html);

			result.outputHtml = saneHtml;
			result.didProcess = true;
		};
	}, []);

	const executeAction = (action: Action) => {
		onExecuteAction?.(action);
	};

	useEffect(() => {
		cardRef.current.onExecuteAction = executeAction;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		cardRef.current.hostConfig = new HostConfig(hostConfig);
	}, [hostConfig]);

	useEffect(() => {
		if (!targetRef.current) {
			return;
		}
		const card = cardRef.current;

		try {
			card.parse(payload);
			const result = card.render();
			if (result) {
				targetRef.current.innerHTML = "";
				targetRef.current.appendChild(result);
				// Add aria-level attribute to heading elements
				const headings = targetRef.current.querySelectorAll("[role='heading']");
				headings.forEach(heading => {
					if (heading.getAttribute("aria-level") === null)
						heading.setAttribute("aria-level", "4");
				});
				// Find element with class names ac-container ac-adaptiveCard and has some aria-label
				const container = targetRef.current.querySelector(
					".ac-container.ac-adaptiveCard[aria-label][tabindex='0']",
				);
				if (container) {
					const ariaLabel = container.getAttribute("aria-label");
					if (ariaLabel) {
						setSpeakText(ariaLabel);
					}
				}
			}
		} catch (error) {
			console.error("Unable to render Adaptive Card: ", error);
		}
	}, [hostConfig, payload]);

	useLiveRegion({
		messageType: "adaptiveCard",
		data: { speakText },
		validation: () => !!speakText,
	});

	return <div ref={targetRef} />;
};

export default AdaptiveCard;
