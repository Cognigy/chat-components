import { FC, useState, KeyboardEvent, useMemo } from "react";
import classes from "./DatePicker.module.css";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import { useMessageContext, useRandomId } from "src/messages/hooks";
import { getOptionsFromMessage } from "./helpers";
import { CloseIcon } from "src/assets/svg";
import Typography from "src/common/Typography";
import { PrimaryButton } from "src/common/Buttons";
import mainClasses from "src/main.module.css";

const DatePicker: FC = () => {
	const { action, message, messageParams } = useMessageContext();
	const options = useMemo(() => getOptionsFromMessage(message), [message]);
	const [showPicker, setShowPicker] = useState(false);
	const [currentDate, setCurrentDate] = useState(options?.defaultDate || "");

	const datePickerHeading = useRandomId("webchatDatePickerHeading");
	const datePickerDescription = useRandomId("webchatDatePickerContentDescription");

	if (!message?.data?._plugin || message.data._plugin.type !== "date-picker") return;

	const { openPickerButtonText, submitButtonText, enableTime, time_24hr, noCalendar, eventName } =
		message.data._plugin.data;

	const openText = openPickerButtonText || "Pick date";
	const submitText = submitButtonText || "Confirm Selection";

	const hasTime = !!enableTime;
	const hasNoCalendar = !!noCalendar;

	const shouldBeDisabled = messageParams?.isConversationEnded || messageParams?.hasReply;

	const handleOpen = () => {
		setShowPicker(true);
	};

	const handleClose = () => {
		setShowPicker(false);
		setCurrentDate(options?.defaultDate || "");
	};

	const handleSubmit = () => {
		action && action(currentDate, null);
		handleClose();
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		const webchatWindow = document.querySelector("div.webchat-plugin-date-picker");
		const button = document.querySelector(
			"div.webchat-plugin-date-picker-footer button",
		) as HTMLButtonElement;

		const calenderElements = webchatWindow?.getElementsByClassName("flatpickr-calendar");
		const calender = calenderElements?.[0] as HTMLElement;

		const tabKeyPress = !event.shiftKey && event.key === "Tab";
		const shiftTabKeyPress = event.shiftKey && event.key === "Tab";

		// Find last input field of time picker
		const minutesAsLastTimeInput = !!enableTime && time_24hr;
		const amPmAsLastTimeInput = !!enableTime && !time_24hr;

		// Time input fields
		const hourField = webchatWindow?.getElementsByClassName(
			"flatpickr-hour",
		)?.[0] as HTMLElement;
		const minutesField = webchatWindow?.getElementsByClassName(
			"flatpickr-minute",
		)?.[0] as HTMLElement;
		const amPmField = webchatWindow?.getElementsByClassName(
			"flatpickr-am-pm",
		)?.[0] as HTMLElement;

		// Check if last time input field is focused
		const isLastTimeInputFieldFocused =
			(minutesAsLastTimeInput && event.target === minutesField) ||
			(amPmAsLastTimeInput && event.target === amPmField);

		// Close Date picker on pressing Escape
		if (event.key === "Esc" || event.key === "Escape") {
			handleClose();
		}

		// add flash effect on focus
		if (tabKeyPress || shiftTabKeyPress) {
			calender.classList.add("flash-focus");
		}

		// Focus should be trapped within date-picker
		// Handle Tab Navigation
		if (tabKeyPress) {
			if (event.target === button) {
				event.preventDefault();
				calender?.focus(); // Move focus to calender from submit button
			} else if (isLastTimeInputFieldFocused) {
				event.preventDefault();
				button?.focus(); // Move focus to cancel button from last time input field
			}
		}
		// Handle Reverse Tab Navigation
		if (shiftTabKeyPress) {
			if (event.target === calender) {
				event.preventDefault();
				button?.focus(); // Move focus to Submit button from calender
			} else if (event.target === hourField) {
				event.preventDefault();
				calender?.focus(); // Move focus to calender from hour input field
			}
		}
	};

	return (
		<div data-testid="datepicker-message">
			<PrimaryButton
				onClick={handleOpen}
				disabled={shouldBeDisabled}
				data-testid="button-open"
			>
				{openText}
			</PrimaryButton>
			{showPicker && (
				<div
					className={classnames(classes.wrapper, "webchat-plugin-date-picker")}
					onKeyDown={handleKeyDown}
					tabIndex={0}
					role="dialog"
					aria-modal="true"
					aria-labelledby={datePickerHeading}
					aria-describedby={datePickerDescription}
				>
					<div
						className={classnames(classes.header, "webchat-plugin-date-picker-header")}
					>
						<span className={mainClasses.srOnly} id={datePickerDescription}>
							Please use Left/ Right arrows to move focus to previous/ next day.
							Please use Up/ Down arrows to move focus to the same day of previous/
							next week. Please use Control + Left/ Right arrows to change the grid of
							dates to previous/ next month. Please use Control + Up/ Down arrows to
							change the grid of dates to previous/ next year.
						</span>
						<span className={classes.left}></span>
						<span className={classes.center}>
							<Typography
								variant="h2-semibold"
								component="span"
								className="webchat-list-template-header-title"
							>
								{eventName || "Calendar"}
							</Typography>
						</span>
						<button
							onClick={handleClose}
							aria-label="Close DatePicker"
							className={classes.right}
							data-testid="button-close"
						>
							<CloseIcon />
						</button>
					</div>

					<div className={classes.contentWrapper}>
						<div
							className={classnames(
								classes.content,
								"webchat-plugin-date-picker-content",
							)}
						>
							<Flatpickr
								onChange={(_date, dateString: string) => {
									setCurrentDate(dateString);
								}}
								options={options}
							/>
						</div>
						<div
							className={classnames(
								classes.footer,
								"webchat-plugin-date-picker-footer",
								hasTime && classes.hasTime,
								hasNoCalendar && classes.noCalendar,
							)}
						>
							<PrimaryButton
								onClick={handleSubmit}
								disabled={!currentDate}
								data-testid="button-submit"
							>
								{submitText}
							</PrimaryButton>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DatePicker;
