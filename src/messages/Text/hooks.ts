import { useState, useEffect } from "react";

export const useStreamText = (text: string, isStreaming: boolean) => {
	const [displayedText, setDisplayedText] = useState("");

	useEffect(() => {
		if (!isStreaming || !text) {
			setDisplayedText(text);
			return;
		}

		let index = 0;
		const intervalId = setInterval(() => {
			if (index <= text.length) {
				setDisplayedText(text.substring(0, index));
				index++;
			} else {
				clearInterval(intervalId);
			}
		}, Math.random() * 10 + 10);

		return () => clearInterval(intervalId);
	}, [text, isStreaming]);

	return displayedText;
};
