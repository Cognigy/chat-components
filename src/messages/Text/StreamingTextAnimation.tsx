import { FC, useEffect, useState } from "react";
import { CSSTransition } from "react-transition-group";
import classes from "./StreamingTextAnimation.module.css";

interface StreamingTextAnimationProps {
	content: string[];                   // text chunks
	onTextUpdate: (newText: string) => void;
}

/**
 * Calculate a typing speed based on the length of the text
 */
const getTypingSpeed = (text: string) => {
	const baseSpeed = 5;   //fastest speed in ms
	const maxSpeed = 20;   // slowest speed in ms
	return Math.max(baseSpeed, Math.min(maxSpeed, text.length / 10));
};

/**
 * Calculate how long the CSSTransition should last
 */
const getTransitionTimeout = (text: string) => {
	const typingSpeed = getTypingSpeed(text);
	const totalDuration = text.length * typingSpeed;
	// buffer to avoid abrupt finishing
	return Math.max(500, totalDuration + 200);
};

const StreamingTextAnimation: FC<StreamingTextAnimationProps> = ({
	content,
	onTextUpdate,
}) => {
	const [currentAnimatedText, setCurrentAnimatedText] = useState("");
	const [typingProgress, setTypingProgress] = useState(0);
	const [animationQueue, setAnimationQueue] = useState<string[]>([]);
	const [lastAnimatedIndex, setLastAnimatedIndex] = useState<number | null>(null);
	const [animationComplete, setAnimationComplete] = useState(false);

	/**
	 * Whenever `content` changes, queue up any new chunks that haven't been animated yet.
	 */
	useEffect(() => {
		const startIndex = lastAnimatedIndex === null ? 0 : lastAnimatedIndex + 1;
		if (startIndex < content.length) {
			setAnimationQueue(content.slice(startIndex));
		}
	}, [content, lastAnimatedIndex]);

	/**
	 * If there's something in the queue, pick up the next chunk.
	 */
	useEffect(() => {
		if (animationQueue.length === 0) return;
		if (currentAnimatedText === animationQueue[0]) return;

		setCurrentAnimatedText(animationQueue[0]);
	}, [animationQueue, currentAnimatedText]);

	/**
	 * Type out `currentAnimatedText` one character at a time.
	 */
	useEffect(() => {
		if (!currentAnimatedText) return;

		// If we've typed the whole chunk, mark as complete
		if (typingProgress >= currentAnimatedText.length) {
			setAnimationComplete(true);
			setTypingProgress(0);
			return;
		}

		const timer = setTimeout(() => {
			setTypingProgress((prev) => prev + 1);
		}, getTypingSpeed(currentAnimatedText));

		return () => clearTimeout(timer);
	}, [currentAnimatedText, typingProgress]);

	/**
	 * When the current animation is complete:
	 *   1. Send the chunk up to `onTextUpdate`.
	 *   2. Move on to the next chunk in the queue (if any).
	 */
	useEffect(() => {
		if (!animationComplete) return;

		onTextUpdate(currentAnimatedText);

		// Reset & proceed to the next chunk
		setCurrentAnimatedText("");
		setAnimationQueue((prev) => prev.slice(1));
		setLastAnimatedIndex((prev) => (prev === null ? 0 : prev + 1));
		setAnimationComplete(false);
	}, [animationComplete, currentAnimatedText, onTextUpdate]);

	/**
	 * Render the “typing in progress” chunk as it appears.
	 */
	return (
		<CSSTransition
			in={!!currentAnimatedText}
			timeout={getTransitionTimeout(currentAnimatedText)}
			classNames={{
				enter: classes["typewriter-enter"],
				enterActive: classes["typewriter-enter-active"],
				enterDone: classes["typewriter-enter-done"],
				exit: classes["typewriter-exit"],
				exitActive: classes["typewriter-exit-active"],
			}}
			onEntered={() => setAnimationComplete(true)}
			unmountOnExit
		>
			<span className={classes.typingText}>
				{currentAnimatedText.slice(0, typingProgress)}
			</span>
		</CSSTransition>
	);
};

export default StreamingTextAnimation;
