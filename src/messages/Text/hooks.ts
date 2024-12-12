import { useState, useEffect, useRef } from "react";
import { StreamingTextState } from "../types";
import { IMessage } from "@cognigy/socket-client";

export const useStreamText = (content: string | string[], isStreaming: boolean, source: IMessage["source"]) => {
	const [textStates, setTextStates] = useState<StreamingTextState[]>([]);
	const animationQueue = useRef<number>(0);

	useEffect(() => {
		if (!isStreaming || source !== 'bot' || !Array.isArray(content)) {
			return setTextStates(
				Array.isArray(content)
					? content.map(text => ({ displayedText: text, isComplete: true }))
					: [{ displayedText: content as string, isComplete: true }],
			);
		}

		const texts = Array.isArray(content) ? content : [content];

		// Initialize states if needed
		if (textStates.length !== texts.length) {
			setTextStates(
				texts.map(() => ({
					displayedText: "",
					isComplete: false,
				})),
			);
		}

		const animateText = (textIndex: number) => {
			if (textIndex >= texts.length) return;

			const text = texts[textIndex];
			let charIndex = 0;

			const intervalId = setInterval(() => {
				if (charIndex <= text.length) {
					setTextStates(prev =>
						prev.map((state, i) =>
							i === textIndex
								? {
									displayedText: text.substring(0, charIndex),
									isComplete: charIndex === text.length,
								}
								: state,
						),
					);

					charIndex++;
				} else {
					clearInterval(intervalId);
					// Start next text animation
					if (textIndex < texts.length - 1) {
						animateText(textIndex + 1);
					}
				}
			}, Math.random() * 10 + 10);

			return () => clearInterval(intervalId);
		};

		animateText(animationQueue.current);
	}, [content, isStreaming, source]);

	return textStates;
};
