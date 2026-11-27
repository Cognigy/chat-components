import { IMessage } from "@cognigy/socket-client";

/**
 * Payload of a rating message, sent as `data._plugin = { type: "rating", data }`.
 * Every key is optional; `getRatingOptions` fills in the defaults.
 */
export interface IRatingPluginData {
	title?: string;
	/** Number of stars. Clamped to 3–10, defaults to 5. */
	maxRating?: number;
	/** Shows a comment field once a rating is selected. Defaults to `true`. */
	enableComment?: boolean;
	commentPlaceholder?: string;
	/** A comment is mandatory for ratings up to and including this value. `0` never requires one. */
	commentRequiredBelow?: number;
	submitButtonText?: string;
	thankYouText?: string;
}

export type TRatingOptions = Required<IRatingPluginData>;

export const MIN_STARS = 3;
export const MAX_STARS = 10;
export const MAX_COMMENT_LENGTH = 250;

const defaultOptions: TRatingOptions = {
	title: "How would you rate this conversation?",
	maxRating: 5,
	enableComment: true,
	commentPlaceholder: "Tell us more (optional)",
	commentRequiredBelow: 0,
	submitButtonText: "Send feedback",
	thankYouText: "Thank you for your feedback!",
};

type TRatingPlugin = { type?: string; data?: IRatingPluginData };

const getRatingPlugin = (message?: IMessage) => message?.data?._plugin as TRatingPlugin | undefined;

export const isRatingMessage = (message?: IMessage) => getRatingPlugin(message)?.type === "rating";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Normalizes the plugin payload: unset and empty values fall back to the
 * defaults, the number of stars is clamped to a range the bubble can fit.
 */
export const getRatingOptions = (message?: IMessage): TRatingOptions => {
	const data = getRatingPlugin(message)?.data ?? {};

	const maxRating = Number.isFinite(Number(data.maxRating))
		? clamp(Math.round(Number(data.maxRating)), MIN_STARS, MAX_STARS)
		: defaultOptions.maxRating;

	const commentRequiredBelow = Number.isFinite(Number(data.commentRequiredBelow))
		? clamp(Math.round(Number(data.commentRequiredBelow)), 0, maxRating)
		: defaultOptions.commentRequiredBelow;

	return {
		title: data.title || defaultOptions.title,
		maxRating,
		enableComment: data.enableComment ?? defaultOptions.enableComment,
		commentPlaceholder: data.commentPlaceholder || defaultOptions.commentPlaceholder,
		commentRequiredBelow,
		submitButtonText: data.submitButtonText || defaultOptions.submitButtonText,
		thankYouText: data.thankYouText || defaultOptions.thankYouText,
	};
};

export const isCommentRequired = (rating: number, options: TRatingOptions) =>
	options.enableComment && rating > 0 && rating <= options.commentRequiredBelow;

/**
 * The postback sent when the rating is submitted. `text` is what shows up in
 * the user's bubble; the flow reads the structured values from `data`.
 */
export const getRatingPostback = (rating: number, comment: string, options: TRatingOptions) => ({
	text: `${rating}/${options.maxRating}`,
	data: {
		rating: {
			value: rating,
			max: options.maxRating,
			comment: comment || null,
		},
	},
});
