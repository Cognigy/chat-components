import { FC, useRef, useState } from "react";
import classes from "./DatePicker.module.css";
import classnames from "classnames";

import Flatpickr from "react-flatpickr";
import "./flatpickr.css";
// import PrimaryButton from "src/common/ActionButtons/PrimaryButton";
import { useMessageContext } from "../hooks";
import { getOptionsFromMessage } from "./helpers";
import { CloseIcon } from "src/assets/svg";
import Typography from "src/common/Typography";

const DatePicker: FC = () => {
	const [showPicker, setShowPicker] = useState(false);
	const [currentDate, setCurrentDate] = useState("");
	const fp = useRef<Flatpickr>(null);
	const { action, message, messageParams } = useMessageContext();

	const handleSubmit = () => {
		setShowPicker(false);
		action && action(currentDate);
	};

	const handleClose = () => {
		setShowPicker(false);
	};

	return (
		<>
			<button onClick={() => setShowPicker(true)} disabled={!!messageParams?.hasReply}>
				Show Picker
			</button>
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
							ref={fp}
							onChange={(_date: Date[], dateString: string) => {
								setCurrentDate(dateString);
							}}
							onDayCreate={(_dObj, _dStr, fp, dayElem) => {
								dayElem.innerHTML = `<span class='dayInner'>${dayElem.innerHTML}</span>`;

								// weeks
								const weekContainer = fp?.weekNumbers;
								const weekItem =
									weekContainer?.getElementsByClassName("flatpickr-day");

								if (weekItem) {
									for (let index = 0; index < weekItem.length; index++) {
										// we skip it if is already created
										const weekdayInner =
											weekItem[index]?.getElementsByClassName("weekdayInner");
										if (weekdayInner.length === 0) {
											// TODO: check also current year
											const currentWeek =
												fp?.config?.getWeek(new Date()) || 0;
											weekItem[index].innerHTML = `<span class='weekdayInner${
												weekItem[index].innerHTML === currentWeek.toString()
													? " currentWeek"
													: ""
											}'>${weekItem[index].innerHTML}</span>`;
										}
									}
								}
							}}
							options={getOptionsFromMessage(message)}
						/>
					</div>
					<div
						className={classnames(classes.footer, "webchat-plugin-date-picker-footer")}
					>
						<button onClick={handleSubmit} disabled={!currentDate}>
							Confirm Selection
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default DatePicker;
