import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IMessage } from "@cognigy/socket-client";
import Message from "src/messages/Message";
import { match } from "src/matcher";
import {
	getRatingOptions,
	getRatingPostback,
	isCommentRequired,
	MAX_STARS,
	MIN_STARS,
} from "src/messages/Rating/helper";
import ratingFixture from "test/fixtures/rating.json";

const message = { source: "bot", ...ratingFixture } as unknown as IMessage;

const ratingMessage = (data: Record<string, unknown>) =>
	({
		source: "bot",
		text: "",
		data: { _plugin: { type: "rating", data } },
	}) as unknown as IMessage;

describe("Message Rating", () => {
	it("is matched by the rating plugin type", () => {
		const unknownPlugin = {
			text: "",
			data: { _plugin: { type: "unknown" } },
		} as unknown as IMessage;

		expect(match(message)).toHaveLength(1);
		expect(match(unknownPlugin)).toEqual([]);
	});

	it("renders the title, one star per point and a disabled submit button", () => {
		render(<Message message={message} />);

		expect(screen.getByTestId("rating-message")).toBeInTheDocument();
		expect(screen.getByText("How would you rate this conversation?")).toBeInTheDocument();
		expect(document.querySelectorAll(".webchat-rating-star")).toHaveLength(5);
		expect(screen.getByTestId("rating-submit")).toBeDisabled();
	});

	it("fills the stars up to the selected one", () => {
		render(<Message message={message} />);

		fireEvent.click(screen.getByTestId("rating-star-3"));

		expect(screen.getByTestId("rating-star-1")).toHaveClass("starFilled");
		expect(screen.getByTestId("rating-star-3")).toHaveClass("starFilled");
		expect(screen.getByTestId("rating-star-4")).not.toHaveClass("starFilled");
		expect(screen.getByTestId("rating-submit")).toBeEnabled();
	});

	it("previews the hovered star and restores the selection on mouse leave", () => {
		render(<Message message={message} />);

		fireEvent.click(screen.getByTestId("rating-star-2"));
		fireEvent.mouseEnter(screen.getByTestId("rating-star-5"));
		expect(screen.getByTestId("rating-star-5")).toHaveClass("starFilled");

		fireEvent.mouseLeave(document.querySelector(".webchat-rating-stars")!);
		expect(screen.getByTestId("rating-star-5")).not.toHaveClass("starFilled");
		expect(screen.getByTestId("rating-star-2")).toHaveClass("starFilled");
	});

	it("shows the comment field once a rating is selected", () => {
		render(<Message message={message} />);

		expect(screen.queryByTestId("rating-comment")).not.toBeInTheDocument();

		fireEvent.click(screen.getByTestId("rating-star-4"));

		expect(screen.getByTestId("rating-comment")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Tell us more (optional)")).toBeInTheDocument();
	});

	it("does not render the comment field when comments are disabled", () => {
		render(<Message message={ratingMessage({ enableComment: false })} />);

		fireEvent.click(screen.getByTestId("rating-star-4"));

		expect(screen.queryByTestId("rating-comment")).not.toBeInTheDocument();
	});

	it("clears the selection and the comment", () => {
		render(<Message message={message} />);

		fireEvent.click(screen.getByTestId("rating-star-4"));
		fireEvent.change(screen.getByTestId("rating-comment"), { target: { value: "Great" } });
		fireEvent.click(screen.getByTestId("rating-clear"));

		expect(screen.getByTestId("rating-star-1")).not.toHaveClass("starFilled");
		expect(screen.queryByTestId("rating-comment")).not.toBeInTheDocument();
		expect(screen.getByTestId("rating-submit")).toBeDisabled();
	});

	it("sends the rating and the comment as a postback and shows the thank-you text", () => {
		const action = vi.fn();
		render(<Message message={message} action={action} />);

		fireEvent.click(screen.getByTestId("rating-star-4"));
		fireEvent.change(screen.getByTestId("rating-comment"), {
			target: { value: "  Quick and helpful  " },
		});
		fireEvent.click(screen.getByTestId("rating-submit"));

		expect(action).toHaveBeenCalledTimes(1);
		expect(action).toHaveBeenCalledWith("4/5", {
			rating: { value: 4, max: 5, comment: "Quick and helpful" },
		});
		expect(screen.getByText("Thank you for your feedback!")).toBeInTheDocument();
		expect(screen.queryByTestId("rating-submit")).not.toBeInTheDocument();
	});

	it("requires a comment for a low rating", () => {
		const action = vi.fn();
		render(<Message message={message} action={action} />);

		fireEvent.click(screen.getByTestId("rating-star-2"));
		fireEvent.click(screen.getByTestId("rating-submit"));

		expect(action).not.toHaveBeenCalled();
		expect(screen.getByText("Please tell us what went wrong")).toBeInTheDocument();

		fireEvent.change(screen.getByTestId("rating-comment"), { target: { value: "Too slow" } });
		expect(screen.queryByText("Please tell us what went wrong")).not.toBeInTheDocument();

		fireEvent.click(screen.getByTestId("rating-submit"));
		expect(action).toHaveBeenCalledWith("2/5", {
			rating: { value: 2, max: 5, comment: "Too slow" },
		});
	});

	it("hides the comment hint again after a few seconds", () => {
		vi.useFakeTimers();
		try {
			render(<Message message={message} />);

			fireEvent.click(screen.getByTestId("rating-star-1"));
			fireEvent.click(screen.getByTestId("rating-submit"));
			expect(screen.getByText("Please tell us what went wrong")).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(3000);
			});
			expect(screen.queryByText("Please tell us what went wrong")).not.toBeInTheDocument();
		} finally {
			vi.useRealTimers();
		}
	});

	it("cannot be submitted once the conversation has ended", () => {
		const action = vi.fn();
		render(<Message message={message} action={action} isConversationEnded />);

		expect(screen.getByTestId("rating-submit")).toBeDisabled();
		expect(document.querySelector(".webchat-rating-stars")).toHaveClass("disabled");
	});

	it("has static class names", () => {
		render(<Message message={message} />);
		fireEvent.click(screen.getByTestId("rating-star-5"));

		expect(document.querySelector(".webchat-rating-root")).toBeInTheDocument();
		expect(document.querySelector(".webchat-rating-title")).toBeInTheDocument();
		expect(document.querySelector(".webchat-rating-stars")).toBeInTheDocument();
		expect(document.querySelector(".webchat-rating-clear")).toBeInTheDocument();
		expect(document.querySelector(".webchat-rating-comment")).toBeInTheDocument();
		expect(document.querySelector(".webchat-rating-submit")).toBeInTheDocument();
	});
});

describe("Rating helpers", () => {
	it("falls back to the defaults for an empty payload", () => {
		expect(getRatingOptions(ratingMessage({}))).toEqual({
			title: "How would you rate this conversation?",
			maxRating: 5,
			enableComment: true,
			commentPlaceholder: "Tell us more (optional)",
			commentRequiredBelow: 0,
			submitButtonText: "Send feedback",
			thankYouText: "Thank you for your feedback!",
		});
	});

	it("clamps the number of stars", () => {
		expect(getRatingOptions(ratingMessage({ maxRating: 1 })).maxRating).toBe(MIN_STARS);
		expect(getRatingOptions(ratingMessage({ maxRating: 25 })).maxRating).toBe(MAX_STARS);
		expect(getRatingOptions(ratingMessage({ maxRating: "7" })).maxRating).toBe(7);
		expect(getRatingOptions(ratingMessage({ maxRating: "many" })).maxRating).toBe(5);
	});

	it("never requires a comment above the highest rating", () => {
		const options = getRatingOptions(ratingMessage({ maxRating: 5, commentRequiredBelow: 9 }));
		expect(options.commentRequiredBelow).toBe(5);
	});

	it("requires a comment only for ratings at or below the threshold", () => {
		const options = getRatingOptions(ratingMessage({ commentRequiredBelow: 2 }));

		expect(isCommentRequired(0, options)).toBe(false);
		expect(isCommentRequired(2, options)).toBe(true);
		expect(isCommentRequired(3, options)).toBe(false);
		expect(
			isCommentRequired(1, getRatingOptions(ratingMessage({ enableComment: false }))),
		).toBe(false);
	});

	it("builds the postback and omits an empty comment", () => {
		const options = getRatingOptions(ratingMessage({ maxRating: 10 }));

		expect(getRatingPostback(8, "", options)).toEqual({
			text: "8/10",
			data: { rating: { value: 8, max: 10, comment: null } },
		});
	});
});
