import { Plugin } from "flatpickr/dist/types/options";
import { Instance } from "flatpickr/dist/types/instance";

export interface Config {
	arrowIcon: string;
}

/**
 * Custom flatpickr plugin that adds some DOM elements for webchat v3 design
 * It handles timeContainer, weekNumbers and dayElements
 */
function customElements(pluginConfig: Config): Plugin {
	return function (fp: Instance) {
		const { arrowIcon } = pluginConfig;

		function buildTimeArrows() {
			if (!fp?.config?.enableTime) return;
			const arrowUp = fp?.timeContainer?.getElementsByClassName("arrowUp");
			const arrowDown = fp?.timeContainer?.getElementsByClassName("arrowDown");
			if (arrowUp) {
				for (let index = 0; index < arrowUp.length; index++) {
					arrowUp[index].innerHTML = arrowIcon;
				}
			}
			if (arrowDown) {
				for (let index = 0; index < arrowDown.length; index++) {
					arrowDown[index].innerHTML = arrowIcon;
				}
			}
		}

		function upsertTimeArrows() {
			if (!fp?.config?.enableTime) return;
			const amPm = fp?.timeContainer?.querySelector("span.flatpickr-am-pm");
			if (amPm) {
				const hasArrows = amPm.querySelector("span.arrowUp");
				if (!hasArrows) {
					const mode = fp?.amPM?.innerText;

					const amPmArrowUp = fp._createElement<HTMLSpanElement>("span", "arrowUp");
					if (mode === "AM") amPmArrowUp.classList.add("disabled");
					amPmArrowUp.innerHTML = arrowIcon;

					const amPmarrowDown = fp._createElement<HTMLSpanElement>("span", "arrowDown");
					if (mode === "PM") amPmarrowDown.classList.add("disabled");
					amPmarrowDown.innerHTML = arrowIcon;

					amPm.appendChild(amPmArrowUp);
					amPm.appendChild(amPmarrowDown);
				}
			}
		}

		function handleWeekNumbers() {
			if (!fp?.config?.weekNumbers) return;
			const weekItem = fp?.weekNumbers?.getElementsByClassName("flatpickr-day");
			if (weekItem) {
				for (let index = 0; index < weekItem.length; index++) {
					const weekdayInner = weekItem[index]?.getElementsByClassName("weekdayInner");
					if (weekdayInner.length === 0) {
						const currentWeek = fp?.config?.getWeek(new Date()) || 0;
						const isCurrentWeekYear =
							weekItem[index].innerHTML === currentWeek.toString() &&
							fp?.currentYear === new Date().getFullYear();

						weekItem[index].innerHTML = `<span class='weekdayInner${
							isCurrentWeekYear ? " currentWeek" : ""
						}'>${weekItem[index].innerHTML}</span>`;
					}
				}
			}
		}

		function setTimeAlly() {
			fp?.calendarContainer?.setAttribute("tabIndex", "0");
			fp?.calendarContainer?.setAttribute("aria-labelledby", "webchatDatePickerHeaderLabel");

			if (fp?.config?.enableTime) {
				const hourField = fp?.timeContainer?.getElementsByClassName("flatpickr-hour")?.[0];
				hourField?.setAttribute("tabIndex", "0");
				const minutesField =
					fp?.timeContainer?.getElementsByClassName("flatpickr-minute")?.[0];
				minutesField?.setAttribute("tabIndex", "0");
				const amPmField = fp?.timeContainer?.getElementsByClassName("flatpickr-am-pm")?.[0];
				amPmField?.setAttribute("tabIndex", "0");
				amPmField?.setAttribute("role", "button");
			}
		}

		// Accessibility for the calendar, month and year select fields
		// We need to programmatically force certain attributes of the calendar to make it accessible as flatpickr does not provide a way to do it via props
		function setMonthYearSelectAlly() {
			const monthYearDiv =
				fp?.calendarContainer?.getElementsByClassName("flatpickr-current-month")[0];

			// Accessibility for month field
			const monthSelector = monthYearDiv?.getElementsByClassName(
				"flatpickr-monthDropdown-months",
			)?.[0] as HTMLElement;
			// unset aria-label attribute from month input to avaoid redundancy
			monthSelector?.removeAttribute("aria-label");
			// Create label element for month select and append it
			monthSelector?.setAttribute("id", "monthSelector-datepicker");
			const monthLabel = document.createElement("label");
			monthLabel.setAttribute("for", "monthSelector-datepicker");
			monthLabel.textContent = "Month";
			monthYearDiv?.prepend(monthLabel);
			// Set tabindex to month input
			monthSelector?.setAttribute("tabIndex", "0");

			// Accessibility for year field
			const yearInput = monthYearDiv?.getElementsByClassName("cur-year")?.[0] as HTMLElement;
			// unset aria-label attribute from year input to avaoid redundancy
			yearInput?.removeAttribute("aria-label");
			// Create label element for year select and append it
			yearInput?.setAttribute("id", "yearSelector-datepicker");
			const yearLabel = document.createElement("label");
			yearLabel.setAttribute("for", "yearSelector-datepicker");
			yearLabel.textContent = "Year";
			const yearInputWrapper = yearInput?.parentElement as HTMLElement;
			yearInputWrapper?.prepend(yearLabel);
			// Set tabindex to year input
			yearInput?.setAttribute("tabIndex", "0");

			// Set tabindex to inner container of calendar instead of calendar container
			fp?.calendarContainer?.setAttribute("tabIndex", "-1");
			const innerCalenderContainer = fp?.calendarContainer?.getElementsByClassName("flatpickr-innerContainer")[0];
			innerCalenderContainer?.setAttribute("tabIndex", "0");
		}

		// Tabindex for the month select field has to be set on every 'onValueUpdate' event in addition to onReady event
		function setKeyBoardA11yForMonthSelect() {
			const monthYearDiv =
				fp?.calendarContainer?.getElementsByClassName("flatpickr-current-month")[0];
			const monthSelector = monthYearDiv?.getElementsByClassName(
				"flatpickr-monthDropdown-months",
			)?.[0] as HTMLElement;
			monthSelector?.setAttribute("tabIndex", "0");
		}

		return {
			onReady: [
				upsertTimeArrows,
				buildTimeArrows,
				setTimeAlly,
				setMonthYearSelectAlly,
				() => {
					fp?.loadedPlugins?.push("customElements");
				},
			],
			onDayCreate: [
				(_dObj, _dStr, _fp, dayElem) => {
					dayElem.innerHTML = `<span class='dayInner'>${dayElem.innerHTML}</span>`;
				},
				handleWeekNumbers,
			],
			onValueUpdate: [upsertTimeArrows, setKeyBoardA11yForMonthSelect],
		};
	};
}

export default customElements;
