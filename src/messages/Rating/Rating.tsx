import { ChangeEvent, FC, HTMLAttributes, useEffect, useMemo, useState } from "react";
import classnames from "classnames";
import classes from "./Rating.module.css";
import { useMessageContext } from "src/messages/hooks";
import Typography from "src/common/Typography";
import { PrimaryButton } from "src/common/Buttons";
import { CloseIcon, StarIcon } from "src/assets/svg";
import {
	getRatingOptions,
	getRatingPostback,
	isCommentRequired,
	isRatingMessage,
	MAX_COMMENT_LENGTH,
} from "./helper";

// How long the "comment required" hint stays visible
const ERROR_TIMEOUT_MS = 3000;

interface IStarProps extends HTMLAttributes<HTMLSpanElement> {
	isFilled: boolean;
}

const Star: FC<IStarProps> = ({ isFilled, ...rest }) => (
	<span
		className={classnames("webchat-rating-star", classes.star, isFilled && classes.starFilled)}
		{...rest}
	>
		<StarIcon />
	</span>
);

const Rating: FC = () => {
	const { action, message, messageParams } = useMessageContext();

	const options = useMemo(() => getRatingOptions(message), [message]);

	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const [showError, setShowError] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const shouldBeDisabled = !!messageParams?.isConversationEnded || !!messageParams?.hasReply;

	useEffect(() => {
		if (!showError) return;

		const timeout = setTimeout(() => setShowError(false), ERROR_TIMEOUT_MS);
		return () => clearTimeout(timeout);
	}, [showError]);

	if (!isRatingMessage(message)) return null;

	const handleSelect = (value: number) => {
		setRating(value);
		setShowError(false);
	};

	const handleClear = () => {
		setRating(0);
		setHoveredRating(0);
		setComment("");
		setShowError(false);
	};

	const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setComment(event.target.value);
		if (event.target.value.trim()) setShowError(false);
	};

	const handleSubmit = () => {
		if (!rating) return;

		const trimmedComment = comment.trim();
		if (isCommentRequired(rating, options) && !trimmedComment) {
			setShowError(true);
			return;
		}

		const { text, data } = getRatingPostback(rating, trimmedComment, options);
		action?.(text, data);
		setIsSubmitted(true);
	};

	if (isSubmitted) {
		return (
			<div
				className={classnames("webchat-rating-root", classes.wrapper)}
				data-testid="rating-message"
			>
				<Typography
					variant="body-regular"
					className={classnames("webchat-rating-thank-you", classes.thankYou)}
				>
					{options.thankYouText}
				</Typography>
			</div>
		);
	}

	const stars = Array.from({ length: options.maxRating }, (_, index) => index + 1);

	return (
		<div
			className={classnames("webchat-rating-root", classes.wrapper)}
			data-testid="rating-message"
		>
			<Typography
				variant="title1-semibold"
				component="h4"
				className={classnames("webchat-rating-title", classes.title)}
			>
				{options.title}
			</Typography>
			<div
				className={classnames(
					"webchat-rating-stars",
					classes.stars,
					shouldBeDisabled && classes.disabled,
				)}
				onMouseLeave={() => setHoveredRating(0)}
			>
				{stars.map(value => (
					<Star
						key={value}
						isFilled={value <= (hoveredRating || rating)}
						onClick={() => handleSelect(value)}
						onMouseEnter={() => setHoveredRating(value)}
						data-testid={`rating-star-${value}`}
					/>
				))}
				{rating > 0 && (
					<button
						type="button"
						className={classnames("webchat-rating-clear", classes.clear)}
						onClick={handleClear}
						aria-label="Clear rating"
						data-testid="rating-clear"
					>
						<CloseIcon />
					</button>
				)}
			</div>
			{options.enableComment && rating > 0 && (
				<div className={classes.commentWrapper}>
					<textarea
						className={classnames(
							"webchat-rating-comment",
							classes.comment,
							showError && classes.commentInvalid,
						)}
						placeholder={options.commentPlaceholder}
						maxLength={MAX_COMMENT_LENGTH}
						rows={3}
						value={comment}
						onChange={handleCommentChange}
						disabled={shouldBeDisabled}
						data-testid="rating-comment"
					/>
					<div className={classes.commentMeta}>
						{showError && (
							<span className={classnames("webchat-rating-error", classes.error)}>
								Please tell us what went wrong
							</span>
						)}
						<span className={classes.counter}>
							{comment.length}/{MAX_COMMENT_LENGTH}
						</span>
					</div>
				</div>
			)}
			<PrimaryButton
				className="webchat-rating-submit"
				onClick={handleSubmit}
				disabled={shouldBeDisabled || !rating}
				data-testid="rating-submit"
			>
				{options.submitButtonText}
			</PrimaryButton>
		</div>
	);
};

export default Rating;
