import { FC, useState } from "react";
import classes from "./DatePicker.module.css";
import classnames from "classnames";
import Flatpickr from "react-flatpickr";
import { useMessageContext } from "src/messages/hooks";
import { getOptionsFromMessage } from "./helpers";
import { CloseIcon } from "src/assets/svg";
import Typography from "src/common/Typography";
import { PrimaryButton } from "src/common/Buttons";

const DatePicker: FC = () => {
	const [showPicker, setShowPicker] = useState(false);
	const [currentDate, setCurrentDate] = useState("");
	const { action, message, messageParams } = useMessageContext();

	// @ts-expect-error -> need to update IMessage type on socketclient
	const { openPickerButtonText, submitButtonText, enableTime } = message?.data?._plugin?.data || {};

	const openText = openPickerButtonText || "Pick date";
	const submitText = submitButtonText || "Confirm Selection";

	const hasTime = !!enableTime;

	const handleOpen = () => {
		setShowPicker(true);
	};

	const handleClose = () => {
		setShowPicker(false);
	};

	const handleSubmit = () => {
		setShowPicker(false);
		action && action(currentDate);
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
				>
					<div
						className={classnames(classes.header, "webchat-plugin-date-picker-header")}
					>
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
