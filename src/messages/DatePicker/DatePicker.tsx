import { FC, useState, KeyboardEvent, useMemo, useRef } from "react";
import classes from "./DatePicker.module.css";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import { useMessageContext, useRandomId } from "src/messages/hooks";
import { getOptionsFromMessage, getTimePickerFields } from "./helpers";
import { getFocusableElements } from "src/utils";
import { CloseIcon } from "src/assets/svg";
import Typography from "src/common/Typography";
import { PrimaryButton } from "src/common/Buttons";

const DatePicker: FC = () => {
	const { action, message, messageParams, config } = useMessageContext();

	const options = useMemo(
		() => getOptionsFromMessage(message, config?.settings?.customTranslations),
		[message, config?.settings?.customTranslations],
	);

	const [showPicker, setShowPicker] = useState(false);
	const [currentDate, setCurrentDate] = useState("");

	const openButtonRef = useRef<HTMLButtonElement>(null);

	const datePickerHeading = useRandomId("webchatDatePickerHeading");

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
		setCurrentDate("");
		// Focus back to the open button
		openButtonRef.current?.focus();
	};

	const handleSubmit = () => {
		action && action(currentDate, null);
		handleClose();
	};

	const handleOnChange = (_: Date[], dateString: string) => {
		if (dateString) {
			setCurrentDate(dateString);
		}
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		const webchatWindow = document.querySelector("div.webchat-plugin-date-picker");

		const { firstFocusable, lastFocusable, nextFocusable, prevFocusable } =
			getFocusableElements(webchatWindow as HTMLElement);

		const tabKeyPress = !event.shiftKey && event.key === "Tab";
		const shiftTabKeyPress = event.shiftKey && event.key === "Tab";

		const { firstTimePickerField, lastTimePickerField } = getTimePickerFields(
			webchatWindow as HTMLElement,
			!!enableTime,
			!!time_24hr,
		);

		// Close Date picker on pressing Escape
		if (event.key === "Esc" || event.key === "Escape") {
			handleClose();
		}

		// Ensure focus is trapped within the entire date picker component, overriding Flatpickr's default behavior of trapping focus only within the time picker.
		if (tabKeyPress) {
			// Handle Tab navigation
			if (event.target === lastFocusable) {
				event.preventDefault();
				firstFocusable?.focus();
			} else if (event.target === lastTimePickerField) {
				event.preventDefault();
				nextFocusable?.focus();
			}
		}
		if (shiftTabKeyPress) {
			// Handle Reverse Tab Navigation
			if (event.target === firstFocusable) {
				event.preventDefault();
				lastFocusable?.focus();
			} else if (event.target === firstTimePickerField) {
				event.preventDefault();
				prevFocusable?.focus();
			}
		}
	};

	const closeDatePickerLabel =
		config?.settings?.customTranslations?.ariaLabels?.closeDatePicker || "Close date-picker";

	return (
		<div data-testid="datepicker-message">
			<PrimaryButton
				onClick={handleOpen}
				disabled={shouldBeDisabled}
				data-testid="button-open"
				ref={openButtonRef}
				aria-expanded={showPicker}
				aria-controls={`webchat-plugin-date-picker-${message.id}`}
				aria-haspopup="dialog"
			>
				{openText}
			</PrimaryButton>
			{showPicker && (
				<div
					id={`webchat-plugin-date-picker-${message.id}`}
					className={classnames(classes.wrapper, "webchat-plugin-date-picker")}
					onKeyDown={handleKeyDown}
					tabIndex={0}
					role="dialog"
					aria-modal="true"
					aria-labelledby={datePickerHeading}
				>
					<div
						className={classnames(classes.header, "webchat-plugin-date-picker-header")}
					>
						<span className={classes.left}></span>
						<span className={classes.center}>
							<Typography
								variant="h2-semibold"
								component="h3"
								className="webchat-list-template-header-title"
							>
								{eventName || "Calendar"}
							</Typography>
						</span>
						<button
							onClick={handleClose}
							aria-label={closeDatePickerLabel}
							className={classes.right}
							data-testid="button-close"
							autoFocus
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
								onChange={handleOnChange}
								onReady={handleOnChange}
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
