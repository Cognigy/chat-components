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
			fp?.calendarContainer?.focus();

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

		function setMonthSelectAlly() {
			const monthYearDiv =
				fp?.calendarContainer?.getElementsByClassName("flatpickr-current-month")[0];

			const monthSelector = monthYearDiv?.getElementsByClassName(
				"flatpickr-monthDropdown-months",
			)?.[0] as HTMLElement;
			monthSelector?.setAttribute("id", "monthSelector-datepicker");
			monthSelector?.classList.add("monthSelector-datepicker");
			// unset aria-label attribute from month input to avaoid redundancy
			monthSelector?.removeAttribute("aria-label");

			const monthLabel = document.createElement("label");
			monthLabel.setAttribute("for", "monthSelector-datepicker");

			monthLabel.textContent = "Month";

			monthYearDiv?.prepend(monthLabel);
		}

		function setYearSelectAlly() {
			const monthYearDiv =
				fp?.calendarContainer?.getElementsByClassName("flatpickr-current-month")[0];

			const yearInput = monthYearDiv?.getElementsByClassName("cur-year")?.[0] as HTMLElement;

			const yearInputWrapper = yearInput?.parentElement as HTMLElement;
			yearInput?.setAttribute("id", "yearSelector-datepicker");
			yearInput?.classList.add("yearSelector-datepicker");
			// unset aria-label attribute from year input to avaoid redundancy
			yearInput?.removeAttribute("aria-label");

			const yearLabel = document.createElement("label");
			yearLabel.setAttribute("for", "yearSelector-datepicker");
			yearLabel.textContent = "Year";

			yearInputWrapper?.prepend(yearLabel);
		}

		return {
			onReady: [
				upsertTimeArrows,
				buildTimeArrows,
				setTimeAlly,
				() => {
					fp?.loadedPlugins?.push("customElements");
				},
				setMonthSelectAlly,
				setYearSelectAlly,
			],
			onDayCreate: [
				(_dObj, _dStr, _fp, dayElem) => {
					dayElem.innerHTML = `<span class='dayInner'>${dayElem.innerHTML}</span>`;
				},
				handleWeekNumbers,
			],
			onValueUpdate: [upsertTimeArrows],
		};
	};
}

export default customElements;
