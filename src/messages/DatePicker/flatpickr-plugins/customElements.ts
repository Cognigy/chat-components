import { Plugin } from "flatpickr/dist/types/options";
import { Instance } from "flatpickr/dist/types/instance";
import { IWebchatSettings } from "src/messages/types";

export interface Config {
	arrowIcon: string;
	customTranslations?: IWebchatSettings["customTranslations"];
}

/**
 * Custom flatpickr plugin that adds some DOM elements for webchat v3 design
 * It handles timeContainer, weekNumbers, and custom accessibility logic for some datepicker elements.
 */
function customElements(pluginConfig: Config): Plugin {
	// fp`refers to the Flatpickr instance
	return function (fp: Instance) {
		const { arrowIcon, customTranslations } = pluginConfig;

		// Store event handlers for navigation buttons
		const navKeydownHandlers = new WeakMap<HTMLElement, (event: KeyboardEvent) => void>();

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

		// Set necessary attributes to make Previous and Next month buttons accessible
		function setNavButtonsAlly() {
			const prevButton = fp?.calendarContainer?.querySelector(
				".flatpickr-prev-month",
			) as HTMLElement;
			const nextButton = fp?.calendarContainer?.querySelector(
				".flatpickr-next-month",
			) as HTMLElement;

			updateNavButtonAccessibility(prevButton, "prev");
			updateNavButtonAccessibility(nextButton, "next");
		}

		// Update accessibility attributes for navigation buttons based on their enabled/disabled state
		function updateNavButtonAccessibility(
			button: HTMLElement | null,
			direction: "prev" | "next",
		) {
			if (!button) return;

			const isPrev = direction === "prev";
			const ariaLabel = isPrev
				? customTranslations?.ariaLabels?.datePickerPreviousMonth || "Previous month"
				: customTranslations?.ariaLabels?.datePickerNextMonth || "Next month";

			button.setAttribute("aria-label", ariaLabel);
			button.setAttribute("role", "button");

			if (button.classList.contains("flatpickr-disabled")) {
				button.setAttribute("aria-disabled", "true");
				button.removeAttribute("tabindex");
				// Remove the handler if it exists
				const handler = navKeydownHandlers.get(button);
				if (handler) {
					button.removeEventListener("keydown", handler);
					navKeydownHandlers.delete(button);
				}
			} else {
				button.setAttribute("tabindex", "0");
				button.removeAttribute("aria-disabled");
				// Only add listener if it doesn't exist
				if (!navKeydownHandlers.has(button)) {
					const handler = (event: KeyboardEvent) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							const targetButton = event.target as HTMLElement;
							const isPrevButton =
								targetButton.classList.contains("flatpickr-prev-month");
							fp.changeMonth(isPrevButton ? -1 : 1);
						}
					};
					navKeydownHandlers.set(button, handler);
					button.addEventListener("keydown", handler);
				}
			}
		}

		// Observe navigation buttons for class changes
		function observeNavButtons() {
			const prevButton = fp?.calendarContainer?.querySelector(
				".flatpickr-prev-month",
			) as HTMLElement;
			const nextButton = fp?.calendarContainer?.querySelector(
				".flatpickr-next-month",
			) as HTMLElement;

			if (prevButton && !prevButton.dataset.observed) {
				const observer = new MutationObserver(() => {
					updateNavButtonAccessibility(prevButton, "prev");
				});

				observer.observe(prevButton, {
					attributes: true,
					attributeFilter: ["class"],
				});
				prevButton.dataset.observed = "true";
			}

			if (nextButton && !nextButton.dataset.observed) {
				const observer = new MutationObserver(() => {
					updateNavButtonAccessibility(nextButton, "next");
				});

				observer.observe(nextButton, {
					attributes: true,
					attributeFilter: ["class"],
				});
				nextButton.dataset.observed = "true";
			}
		}

		// Remove tabindex from calender container and set it to innerContainer
		function setDateSelectAlly() {
			fp?.calendarContainer?.setAttribute("tabindex", "-1");
			const daysContainer = fp?.calendarContainer?.getElementsByClassName(
				"flatpickr-innerContainer",
			)[0];
			if (daysContainer) {
				daysContainer.setAttribute("tabindex", "0");
			}
		}

		// Observe month selector for changes and set tabindex again to 0. This is to ensure that the month selector is focusable all the time
		function observeMonthSelector() {
			const monthYearDiv =
				fp?.calendarContainer?.getElementsByClassName("flatpickr-current-month")[0];

			const monthSelector = monthYearDiv?.getElementsByClassName(
				"flatpickr-monthDropdown-months",
			)?.[0] as HTMLElement;

			if (monthSelector) {
				if (monthSelector.dataset.observed === "true") return;

				let timeout: NodeJS.Timeout | null = null;

				const observer = new MutationObserver(() => {
					if (timeout) clearTimeout(timeout);

					timeout = setTimeout(() => {
						monthSelector.setAttribute("tabindex", "0");
					}, 100);
				});

				observer.observe(monthSelector, {
					attributes: true,
					childList: false,
					subtree: false,
				});
				monthSelector.dataset.observed = "true";
			}
		}

		// Set necessary label and attributes to month select for accessibility
		function setMonthSelectAlly() {
			const monthYearDiv =
				fp?.calendarContainer?.getElementsByClassName("flatpickr-current-month")[0];

			const monthSelector = monthYearDiv?.getElementsByClassName(
				"flatpickr-monthDropdown-months",
			)?.[0] as HTMLElement;

			if (monthSelector) {
				monthSelector.setAttribute("id", "webchat-monthSelector-datepicker");
				monthSelector.classList.add("webchat-monthSelector-datepicker");
				// Remove aria-label attribute from month input to avoid redundancy
				monthSelector.removeAttribute("aria-label");

				// Check if a label already exists for the monthSelector
				const existingLabel = monthYearDiv?.querySelector(
					"label[for='webchat-monthSelector-datepicker']",
				);

				// If no label exists, create and prepend a new one
				if (!existingLabel) {
					const monthLabel = document.createElement("label");
					monthLabel.setAttribute("for", "webchat-monthSelector-datepicker");
					monthLabel.textContent = customTranslations?.datePickerMonthLabel || "Month";
					monthYearDiv?.prepend(monthLabel);
				}

				monthSelector.setAttribute("tabindex", "0");

				monthSelector.addEventListener("keydown", event => {
					// If Enter, stop propagation to Flatpickr's internal handlers, so that the select menu can open
					if (event.key === "Enter") {
						event.stopPropagation();
					}
					// If Arrow Up or Down, Change month field to prev or next month
					if (event.key === "ArrowUp" || event.key === "ArrowDown") {
						event.preventDefault();
						event.stopPropagation();
						const isNext = event.key === "ArrowDown";
						fp.changeMonth(isNext ? 1 : -1);
					}
				});
			}
		}

		// Set necessary label and attributes to year input for accessibility
		function setYearSelectAlly() {
			const monthYearDiv =
				fp?.calendarContainer?.getElementsByClassName("flatpickr-current-month")[0];

			const yearInput = monthYearDiv?.getElementsByClassName("cur-year")?.[0] as HTMLElement;

			if (yearInput) {
				const yearInputWrapper = yearInput?.parentElement as HTMLElement;
				yearInput.setAttribute("id", "yearSelector-datepicker");
				yearInput.classList.add("yearSelector-datepicker");
				// Remove aria-label attribute from year input to avoid redundancy
				yearInput.removeAttribute("aria-label");

				// Check if a label already exists for the yearInput
				const existingLabel = yearInputWrapper?.querySelector(
					"label[for='yearSelector-datepicker']",
				);

				// If no label exists, create and prepend a new one
				if (!existingLabel) {
					const yearLabel = document.createElement("label");
					yearLabel.setAttribute("for", "yearSelector-datepicker");
					yearLabel.textContent = customTranslations?.datePickerYearLabel || "Year";
					yearInputWrapper?.prepend(yearLabel);
				}

				yearInput.setAttribute("tabindex", "0");
			}
		}

		// Set necessary attributes to time picker fields for accessibility
		function setTimeAlly() {
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

		return {
			onReady: [
				upsertTimeArrows,
				buildTimeArrows,
				setDateSelectAlly,
				setTimeAlly,
				setMonthSelectAlly,
				setYearSelectAlly,
				setNavButtonsAlly,
				observeNavButtons,
				observeMonthSelector,

				() => {
					fp?.loadedPlugins?.push("customElements");
				},
			],
			onDayCreate: [
				(_dObj, _dStr, _fp, dayElem) => {
					// Set aria-disabled attribute based on flatpickr-disabled class
					const isDisabled = dayElem.classList.contains("flatpickr-disabled");
					if (isDisabled) {
						dayElem.setAttribute("aria-disabled", "true");
					} else {
						dayElem.removeAttribute("aria-disabled");
					}

					dayElem.innerHTML = `<span class='dayInner'>${dayElem.innerHTML}</span>`;
				},
				handleWeekNumbers,
			],
			onValueUpdate: [upsertTimeArrows],
		};
	};
}

export default customElements;
