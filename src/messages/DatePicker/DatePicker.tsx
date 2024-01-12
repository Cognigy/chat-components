import { FC, useState, KeyboardEvent } from "react";
import classes from "./DatePicker.module.css";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import { useMessageContext } from "src/messages/hooks";
import { getOptionsFromMessage } from "./helpers";
import { CloseIcon } from "src/assets/svg";
import Typography from "src/common/Typography";
import { PrimaryButton } from "src/common/Buttons";
import { getRandomId } from "src/utils";
import mainClasses from "src/main.module.css";

const DatePicker: FC = () => {
	const [showPicker, setShowPicker] = useState(false);
	const [currentDate, setCurrentDate] = useState("");
	const { action, message, messageParams } = useMessageContext();

	if (!message?.data?._plugin || message.data._plugin.type !== "date-picker") return;

	const { openPickerButtonText, submitButtonText, enableTime, time_24hr, noCalendar } =
		message.data._plugin.data;

	const openText = openPickerButtonText || "Pick date";
	const submitText = submitButtonText || "Confirm Selection";

	const datePickerHeading = getRandomId("webchatDatePickerHeading");
	const datePickerDescription = getRandomId("webchatDatePickerContentDescription");

	const hasTime = !!enableTime;

	const handleOpen = () => {
		setShowPicker(true);
	};

	const handleClose = () => {
		setShowPicker(false);
	};

	const handleSubmit = () => {
		setShowPicker(false);
		action && action(currentDate, null);
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

		// Focus should be trapped within date-picker
		// Handle Tab Navigation
		if (tabKeyPress) {
			console.log(event.target);
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
		<>
			<PrimaryButton onClick={handleOpen} disabled={!!messageParams?.hasReply}>
				{openText}
			</PrimaryButton>
			{showPicker && (
				<div
					className={classnames(classes.wrapper, "webchat-plugin-date-picker")}
					data-testid="datepicker-message"
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
								dangerouslySetInnerHTML={{ __html: "Calendar" }}
								className="webchat-list-template-header-title"
							/>
						</span>
						<button
							onClick={handleClose}
							// onKeyDown={handleKeyClose}
							aria-label="Close DatePicker"
							className={classes.right}
						>
							<CloseIcon />
						</button>
					</div>

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
							options={getOptionsFromMessage(message)}
						/>
					</div>
					<div
						className={classnames(
							classes.footer,
							"webchat-plugin-date-picker-footer",
							hasTime && classes.hasTime,
							noCalendar && classes.noCalendar,
						)}
					>
						<PrimaryButton onClick={handleSubmit} disabled={!currentDate}>
							{submitText}
						</PrimaryButton>
					</div>
				</div>
			)}
		</>
	);
};

export default DatePicker;
