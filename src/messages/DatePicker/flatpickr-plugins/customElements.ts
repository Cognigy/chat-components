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
 *
 * The calendar grid follows the W3C ARIA APG "Date Picker Dialog" pattern:
 * - `.flatpickr-rContainer` is the `role="grid"` (it wraps the weekday header row and the day rows)
 * - the weekday header is a `role="row"` of `role="columnheader"` cells
 * - the day cells are `role="gridcell"`, grouped 7-per-`role="row"`
 * - focus is managed with a roving tabindex: exactly one day is `tabindex="0"`, the rest `-1`
 * - arrow keys / Home / End / PageUp / PageDown move real DOM focus between days
 */
function customElements(pluginConfig: Config): Plugin {
	// fp`refers to the Flatpickr instance
	return function (fp: Instance) {
		const { arrowIcon, customTranslations } = pluginConfig;

		// Store event handlers for navigation buttons
		const navKeydownHandlers = new WeakMap<HTMLElement, (event: KeyboardEvent) => void>();

		let liveRegion: HTMLElement | null = null;
		// When true, a month/year change is being driven by our PageUp/PageDown handler, which
		// will announce the landed date itself; suppress the month/year-only announcement so the
		// two don't compete in the live region.
		let suppressMonthYearAnnounce = false;

		function createLiveRegion() {
			if (!fp?.calendarContainer) return;
			liveRegion = document.createElement("span");
			liveRegion.setAttribute("aria-live", "polite");
			liveRegion.setAttribute("aria-atomic", "true");
			liveRegion.setAttribute("role", "status");
			liveRegion.style.position = "absolute";
			liveRegion.style.width = "1px";
			liveRegion.style.height = "1px";
			liveRegion.style.overflow = "hidden";
			liveRegion.style.clip = "rect(0, 0, 0, 0)";
			liveRegion.style.whiteSpace = "nowrap";
			fp.calendarContainer.appendChild(liveRegion);
		}

		// Push a message into the polite live region so NVDA speaks it. Re-set even when the
		// text is unchanged (clear first) so repeated navigation to equivalent labels still
		// announces.
		function announce(message: string) {
			if (!liveRegion || !message) return;
			// Clearing first guarantees a DOM change is observed even if the text repeats.
			liveRegion.textContent = "";
			liveRegion.textContent = message;
		}

		// Announce the visible month/year — used when the month/year is changed via the nav
		// buttons or the month/year dropdowns, where focus stays on the control (not a day),
		// so no day-focus announcement fires.
		function announceMonthYear() {
			if (suppressMonthYearAnnounce) return;
			const monthName = fp.l10n.months.longhand[fp.currentMonth];
			announce(`${monthName} ${fp.currentYear}`);
		}

		// Announce a focused day's full spoken date (e.g. "June 23, 2026"). Driven on every
		// day focus change. NVDA does not reliably re-announce a roving-focus gridcell on its
		// own, so this live-region message is what the user actually hears when focus moves
		// between dates via arrows / Home / End / PageUp / PageDown. Because the message
		// includes the month and year, it also covers the month/year change on Page navigation.
		function announceDay(dayElem: HTMLElement | null) {
			const label = dayElem?.getAttribute("aria-label");
			if (label) announce(label);
		}

		// Returns the currently "selectable" day cells of the visible month, i.e. days that
		// belong to the current month and are not disabled. Used for roving-focus targets.
		function getDayCells(): HTMLElement[] {
			return Array.from(
				fp?.calendarContainer?.querySelectorAll<HTMLElement>(".dayContainer .flatpickr-day") ||
					[],
			);
		}

		// Roving tabindex: make exactly one day focusable (tabindex="0"); all others tabindex="-1".
		// Optionally move real DOM focus to it so the screen reader announces the date.
		function setActiveDay(dayElem: HTMLElement | null, options?: { focus?: boolean }) {
			if (!dayElem) return;
			getDayCells().forEach(day => {
				day.setAttribute("tabindex", day === dayElem ? "0" : "-1");
			});
			if (options?.focus) {
				dayElem.focus();
			}
		}

		// Pick the day cell that should be the initial roving-focus target:
		// the selected day, else today, else the first enabled day of the current month.
		function getInitialActiveDay(): HTMLElement | null {
			if (!fp?.calendarContainer) return null;
			return (
				fp.calendarContainer.querySelector<HTMLElement>(".flatpickr-day.selected") ||
				fp.calendarContainer.querySelector<HTMLElement>(".flatpickr-day.today") ||
				fp.calendarContainer.querySelector<HTMLElement>(
					".dayContainer .flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)",
				)
			);
		}

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

		// Number of columns in the calendar grid (7 days of the week).
		const GRID_COLS = 7;

		// Apply the grid structure roles (role="grid" / "columnheader").
		// Day cells keep their position semantics via aria-rowindex/aria-colindex applied
		// per-render in applyDayGridIndices() — we deliberately do NOT wrap them in physical
		// row elements, because flatpickr's native arrow navigation indexes the day cells as
		// direct children of `.dayContainer`; wrapping them breaks that navigation.
		function setDateSelectAlly() {
			// The calendar container is not the grid; keep it out of the tab order.
			fp?.calendarContainer?.setAttribute("tabindex", "-1");

			// `.flatpickr-rContainer` wraps both the weekday header row and the day grid,
			// so it is the correct element to carry role="grid".
			const grid = fp?.calendarContainer?.querySelector<HTMLElement>(".flatpickr-rContainer");
			if (grid) {
				grid.setAttribute("role", "grid");
				grid.setAttribute(
					"aria-label",
					customTranslations?.ariaLabels?.datePickerGridLabel || "Calendar",
				);
				grid.setAttribute(
					"aria-description",
					customTranslations?.ariaLabels?.datePickerGridDescription ||
						"Use arrow keys to navigate through dates",
				);
				grid.setAttribute("aria-colcount", String(GRID_COLS));
				// 1 weekday header row + 6 week rows.
				grid.setAttribute("aria-rowcount", "7");
			}

			// `.flatpickr-innerContainer` is just a layout wrapper now (focus lives on a day cell).
			const innerContainer = fp?.calendarContainer?.getElementsByClassName(
				"flatpickr-innerContainer",
			)[0];
			innerContainer?.removeAttribute("tabindex");
			innerContainer?.removeAttribute("role");
			innerContainer?.removeAttribute("aria-activedescendant");

			// Weekday header is row 1 of the grid; each weekday is a columnheader.
			const weekdayContainer = fp?.calendarContainer?.querySelector(".flatpickr-weekdays");
			if (weekdayContainer) {
				weekdayContainer.setAttribute("role", "row");
				weekdayContainer.setAttribute("aria-rowindex", "1");
			}
			const weekdaySpans = fp?.calendarContainer?.querySelectorAll(".flatpickr-weekday");
			weekdaySpans?.forEach((span, index) => {
				span.setAttribute("role", "columnheader");
				span.setAttribute("abbr", span.textContent?.trim() || "");
				span.setAttribute("aria-colindex", String((index % GRID_COLS) + 1));
			});
		}

		// Give the flat list of day cells grid row/column semantics via aria-rowindex and
		// aria-colindex (instead of physical role="row" wrappers, which would break flatpickr's
		// native arrow navigation). The `.dayContainer` is the rowgroup. Flatpickr rebuilds
		// `.dayContainer` on every render, so this must run after each rebuild.
		function applyDayGridIndices() {
			const dayContainer =
				fp?.calendarContainer?.querySelector<HTMLElement>(".dayContainer");
			if (!dayContainer) return;

			dayContainer.setAttribute("role", "rowgroup");

			const dayCells = Array.from(
				dayContainer.querySelectorAll<HTMLElement>(":scope > .flatpickr-day"),
			);
			dayCells.forEach((cell, i) => {
				// Day rows start at grid row 2 (row 1 is the weekday header).
				cell.setAttribute("aria-rowindex", String(Math.floor(i / GRID_COLS) + 2));
				cell.setAttribute("aria-colindex", String((i % GRID_COLS) + 1));
			});
		}

		// Re-apply grid row roles and restore the single focusable day whenever flatpickr
		// rebuilds the day grid (default-date application, redraws, month/year changes).
		// A MutationObserver on the stable `.flatpickr-days` container is the most robust hook,
		// matching the defensive pattern used for the nav buttons and month selector.
		function observeDayGrid() {
			const daysContainer =
				fp?.calendarContainer?.querySelector<HTMLElement>(".flatpickr-days");
			if (!daysContainer || daysContainer.dataset.gridObserved === "true") return;
			daysContainer.dataset.gridObserved = "true";

			const reapply = () => {
				applyDayGridIndices();
				// Keep exactly one focusable day. Preserve the existing roving target if it is
				// still in the DOM; otherwise fall back to the selected/today/first day.
				const existing = daysContainer.querySelector<HTMLElement>(
					".flatpickr-day[tabindex='0']",
				);
				setActiveDay(existing || getInitialActiveDay(), { focus: false });
			};

			// `.dayContainer` is replaced on every flatpickr render; re-apply on each childList
			// change. We only set attributes (not move nodes), so this never re-triggers itself.
			const observer = new MutationObserver(() => reapply());
			observer.observe(daysContainer, { childList: true, subtree: true });
			// Apply once immediately for the initial render.
			reapply();
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

		// In-month day cells of the visible month (excludes prev/next-month overflow cells).
		function getInMonthCells(): HTMLElement[] {
			return getDayCells().filter(
				c =>
					!c.classList.contains("prevMonthDay") && !c.classList.contains("nextMonthDay"),
			);
		}

		// Read the real Date for a day cell (flatpickr stores it on dateObj).
		function cellDate(cell: HTMLElement): Date | undefined {
			return (cell as unknown as { dateObj?: Date }).dateObj;
		}

		function sameYMD(a: Date | undefined, b: Date): boolean {
			return (
				!!a &&
				a.getFullYear() === b.getFullYear() &&
				a.getMonth() === b.getMonth() &&
				a.getDate() === b.getDate()
			);
		}

		// Find the IN-MONTH cell for a given Y/M/D in the currently visible grid, if present
		// (ignores prev/next-month overflow cells so we match the canonical cell for that date).
		function findInMonthCellByDate(date: Date): HTMLElement | null {
			return getInMonthCells().find(c => sameYMD(cellDate(c), date)) || null;
		}

		// Find ANY cell (including prev/next-month overflow cells) for a given Y/M/D in the
		// currently visible grid. Preference is still given to the canonical in-month cell.
		function findAnyCellByDate(date: Date): HTMLElement | null {
			return (
				findInMonthCellByDate(date) ||
				getDayCells().find(c => sameYMD(cellDate(c), date)) ||
				null
			);
		}

		// After a month/year change, move roving focus to the day with the same day-of-month
		// number (APG PageUp/PageDown behavior). If that day does not exist in the new month
		// (e.g. Jan 31 -> Feb), focus the last day of the month instead.
		function focusSameOrLastDayOfMonth(dayNumber: number) {
			const inMonth = getInMonthCells();
			if (inMonth.length === 0) {
				setActiveDay(getInitialActiveDay(), { focus: true });
				return;
			}
			const sameDay = inMonth.find(c => Number(c.textContent?.trim()) === dayNumber);
			const target = sameDay || inMonth[inMonth.length - 1];
			setActiveDay(target, { focus: true });
		}

		// Keyboard navigation for the calendar grid.
		//
		// IMPORTANT: flatpickr implements Arrow-key navigation natively (focusOnDay /
		// getNextAvailableDay), including disabled-day skipping. We let flatpickr own arrow moves
		// that stay WITHIN the visible month — handling them ourselves previously ran two handlers
		// in parallel that fought over focus. We only take over an arrow when the move crosses a
		// month boundary, because flatpickr there jumps to the "first available day" of the new
		// grid (non-sequential, confusing for screen-reader users) instead of the sequential
		// next/previous calendar day. We also add the keys flatpickr lacks: Home / End (within the
		// week) and PageUp / PageDown (prev/next month, same day number). A separate `focusin`
		// listener (see syncRovingTabindex) keeps the roving tabindex aligned with whatever day is
		// focused, so Tab can always re-enter the grid.
		function setGridKeyNavigation() {
			const daysContainer =
				fp?.calendarContainer?.querySelector<HTMLElement>(".flatpickr-days");
			if (!daysContainer || daysContainer.dataset.keyboardBound === "true") return;
			daysContainer.dataset.keyboardBound = "true";

			const cols = 7;

			daysContainer.addEventListener("keydown", (event: KeyboardEvent) => {
				const currentDay = event.target as HTMLElement;
				if (!currentDay?.classList?.contains("flatpickr-day")) return;

				switch (event.key) {
					case "Home":
					case "End": {
						// First (col 0) / last (col 6) day of the focused week. Operate on the full
						// day list so week columns line up regardless of disabled days.
						event.preventDefault();
						event.stopPropagation();
						const cells = getDayCells();
						const idx = cells.indexOf(currentDay);
						if (idx === -1) return;
						const weekStart = idx - (idx % cols);
						const targetIdx =
							event.key === "Home" ? weekStart : weekStart + (cols - 1);
						const target = cells[targetIdx];
						if (target && !target.classList.contains("flatpickr-disabled")) {
							setActiveDay(target, { focus: true });
						}
						return;
					}
					case "PageUp":
					case "PageDown": {
						// Prev/next month (Shift = year), keeping the same day-of-month number.
						// stopPropagation so flatpickr's keydown never also acts on this event.
						event.preventDefault();
						event.stopPropagation();
						const dayNumber = Number(currentDay.textContent?.trim());
						const forward = event.key === "PageDown";
						// Suppress flatpickr's month/year-change announcement; focusing the landed
						// day below announces the full date (which already includes month + year).
						suppressMonthYearAnnounce = true;
						if (event.shiftKey) {
							fp.changeYear(fp.currentYear + (forward ? 1 : -1));
						} else {
							fp.changeMonth(forward ? 1 : -1);
						}
						suppressMonthYearAnnounce = false;
						focusSameOrLastDayOfMonth(dayNumber);
						return;
					}
					case "Tab": {
						// Let the browser move focus out of the grid natively (forward to the time
						// fields / submit, backward to the month-year nav). We only stop the event
						// reaching flatpickr's own keydown, which otherwise hijacks Shift+Tab and
						// sends focus to its hidden input (a dead end). We do NOT preventDefault, so
						// native tabbing proceeds; and the dialog's focus trap does not act on a day
						// cell (never the first/last focusable), so stopping propagation is safe.
						event.stopPropagation();
						return;
					}
					case "Enter":
					case " ":
					case "Spacebar": {
						// Select the focused day. flatpickr selects on Enter natively, but Space
						// does not select, so handle both here and stop flatpickr double-acting.
						event.preventDefault();
						event.stopPropagation();
						// Select the focused day by dispatching a click — this routes through the
						// same day-click path as the mouse, so the click capture listener below marks
						// the selection and suppresses flatpickr's hour-focus jump uniformly for both
						// keyboard and mouse. onValueUpdate then keeps focus on the selected day.
						currentDay.click();
						return;
					}
					case "ArrowLeft":
					case "ArrowRight":
					case "ArrowUp":
					case "ArrowDown": {
						// Within the visible month, flatpickr's native arrow navigation is correct,
						// so we let it handle the move (fall through). We ONLY take over when the
						// move would cross a month boundary: flatpickr's cross-month behavior jumps
						// to the "first available day" of the new grid (e.g. ArrowRight on July 11 ->
						// June 28), which is non-sequential and confusing for screen-reader users.
						// Instead we move to the SEQUENTIAL next/previous calendar day.
						const from = cellDate(currentDay);
						if (!from) return; // no date info -> leave it to flatpickr

						const deltaDays =
							event.key === "ArrowRight"
								? 1
								: event.key === "ArrowLeft"
								? -1
								: event.key === "ArrowDown"
								? cols
								: -cols;
						const targetDate = new Date(from);
						targetDate.setDate(targetDate.getDate() + deltaDays);

						// If the sequential target is an in-month cell already in this grid, let
						// flatpickr move focus there natively (no interception).
						if (findInMonthCellByDate(targetDate)) return;

						// Otherwise the target lives in the adjacent month: flip the calendar and
						// land focus on that exact date (sequential), announced via focusin.
						event.preventDefault();
						event.stopPropagation();
						suppressMonthYearAnnounce = true;
						fp.changeMonth(deltaDays > 0 ? 1 : -1);
						suppressMonthYearAnnounce = false;

						const exact = findInMonthCellByDate(targetDate);
						if (exact && !exact.classList.contains("flatpickr-disabled")) {
							setActiveDay(exact, { focus: true });
						} else {
							// Exact date missing/disabled (rare, e.g. min/max bounds): fall back to
							// the nearest enabled in-month day in the direction of travel.
							const inMonth = getInMonthCells().filter(
								c => !c.classList.contains("flatpickr-disabled"),
							);
							const fallback =
								deltaDays > 0 ? inMonth[0] : inMonth[inMonth.length - 1];
							setActiveDay(fallback || getInitialActiveDay(), { focus: true });
						}
						return;
					}
				}
			});

			// Selecting a day fires a click on the day cell — for the mouse directly, and for the
			// keyboard via currentDay.click() in the Enter/Space handler above. flatpickr binds its
			// selectDate to the days container (bubble phase). At the end of selectDate it
			// force-moves focus: to the time picker's hour field when a time picker exists, or to
			// the just-clicked day element otherwise (but that element is detached by the preceding
			// buildDays() rebuild, so focus actually drops to <body>). Either way the user is pulled
			// out of the grid, and the hour case causes a focus flash the screen reader announces.
			//
			// In the CAPTURE phase here (before flatpickr's bubble-phase selectDate runs) we
			// neutralize the hour field's .focus() so flatpickr can't focus it at all — that
			// removes the focus flash the screen reader would otherwise announce. Then, on the next
			// microtask — after selectDate has fully run, including its own focus calls — we place
			// focus on the just-selected day in the rebuilt grid. This keeps the user in the grid
			// for single/range/multiple selection, with or without a time picker. The hour focus
			// override is restored in the same microtask (guarded so re-entrant clicks never
			// capture an already-neutralized focus and leave the field unfocusable).
			let hourFocusSuppressed = false;
			daysContainer.addEventListener(
				"click",
				(event: MouseEvent) => {
					const cell = (event.target as HTMLElement)?.closest?.(".flatpickr-day");
					if (!cell || cell.classList.contains("flatpickr-disabled")) return;

					const hour = fp?.hourElement;
					let restoreHourFocus: (() => void) | null = null;
					if (hour && !hourFocusSuppressed) {
						hourFocusSuppressed = true;
						const originalFocus = hour.focus.bind(hour);
						hour.focus = () => {};
						restoreHourFocus = () => {
							hour.focus = originalFocus;
							hourFocusSuppressed = false;
						};
					}

					Promise.resolve().then(() => {
						restoreHourFocus?.();
						// Dialog may have closed (e.g. Confirm clicked); don't focus a detached grid.
						if (!fp?.calendarContainer?.isConnected) return;
						// Read the selected date now — selectDate has run and updated it by this point.
						const selectedDate = fp.latestSelectedDateObj;
						const justSelected = selectedDate && findAnyCellByDate(selectedDate);
						setActiveDay(justSelected || getInitialActiveDay(), { focus: true });
					});
				},
				true,
			);
		}

		// On every day-cell focus: (1) keep the roving tabindex (a single tabindex="0" day)
		// aligned with the focused day — whether moved by flatpickr's native arrow handling or by
		// our Home/End/Page handlers — so Tab always re-enters the grid on the right day; and
		// (2) announce the focused date via the live region, since NVDA does not reliably speak a
		// roving-focus gridcell on its own.
		function syncRovingTabindex() {
			const daysContainer =
				fp?.calendarContainer?.querySelector<HTMLElement>(".flatpickr-days");
			if (!daysContainer || daysContainer.dataset.focusinBound === "true") return;
			daysContainer.dataset.focusinBound = "true";

			daysContainer.addEventListener("focusin", (event: FocusEvent) => {
				const target = event.target as HTMLElement;
				if (!target?.classList?.contains("flatpickr-day")) return;
				if (target.getAttribute("tabindex") !== "0") {
					getDayCells().forEach(day => {
						day.setAttribute("tabindex", day === target ? "0" : "-1");
					});
				}

				// When focus enters the grid from OUTSIDE (e.g. tabbing/clicking from the
				// next-month button), NVDA speaks the grid's own context ("Calendar, table, use
				// arrow keys…") and drops a live-region update that lands at the same moment. Defer
				// the date announcement one tick so it is spoken AFTER the grid context, instead of
				// being clobbered by it. For moves WITHIN the grid (arrows/Home/End/Page) there is
				// no competing context speech, so announce immediately.
				const fromOutsideGrid = !(
					event.relatedTarget instanceof HTMLElement &&
					daysContainer.contains(event.relatedTarget)
				);
				if (fromOutsideGrid) {
					setTimeout(() => announceDay(target), 50);
				} else {
					announceDay(target);
				}
			});
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
				createLiveRegion,
				setGridKeyNavigation,
				syncRovingTabindex,
				// Apply grid row roles + the initial roving-focus day, and keep them correct
				// across every flatpickr rebuild. Does not steal focus — the dialog focuses its
				// heading on open; the first Tab into the grid lands on the focusable day.
				observeDayGrid,

				() => {
					fp?.loadedPlugins?.push("customElements");
				},
			],
			onYearChange: [announceMonthYear],
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
					// Real gridcell so the screen reader exposes it as the focused cell of the grid
					// (the previous role="presentation" hid it, which broke arrow-key navigation).
					dayElem.setAttribute("role", "gridcell");
					// Roving tabindex default: not focusable until promoted by setActiveDay().
					dayElem.setAttribute("tabindex", "-1");
					// Mark the selected day for assistive tech.
					if (dayElem.classList.contains("selected")) {
						dayElem.setAttribute("aria-selected", "true");
					} else {
						dayElem.removeAttribute("aria-selected");
					}
					// Ensure each date has a unique ID (used by tests / potential labelling).
					if (!dayElem.id) {
						dayElem.id = `fp-day-${Math.random().toString(36).substring(2, 9)}`;
					}
					// Spoken aria-label so the screen reader announces e.g. "June 1, 2026" when the
					// day is focused. Use the cell's own date (dayElem.dateObj) rather than the
					// visible month, so prev/next-month days announce their real month — not "June 31".
					const cellDate = (dayElem as unknown as { dateObj?: Date }).dateObj;
					if (cellDate) {
						const monthName = fp.l10n.months.longhand[cellDate.getMonth()];
						dayElem.setAttribute(
							"aria-label",
							`${monthName} ${cellDate.getDate()}, ${cellDate.getFullYear()}`,
						);
					}
				},
				handleWeekNumbers,
			],
			onValueUpdate: [
				upsertTimeArrows,
				// Selecting a date rebuilds the day grid synchronously (flatpickr calls
				// buildDays() before firing onValueUpdate). Re-apply the grid indices, mark the
				// selected gridcell(s), and keep the roving tabindex pointed at a valid day.
				() => {
					applyDayGridIndices();

					getDayCells().forEach(day => {
						if (day.classList.contains("selected")) {
							day.setAttribute("aria-selected", "true");
						} else {
							day.removeAttribute("aria-selected");
						}
					});

					// Keep the roving tabindex pointed at a valid day WITHOUT moving focus here.
					// For a date selection, flatpickr force-moves focus AFTER this hook (to the time
					// picker, or to a now-detached day -> <body>); that is handled by the click
					// capture listener's microtask, which places focus on the just-selected day once
					// selectDate has fully run. Moving focus here would be overwritten by flatpickr.
					const existing = fp?.calendarContainer?.querySelector<HTMLElement>(
						".dayContainer .flatpickr-day[tabindex='0']",
					);
					setActiveDay(existing || getInitialActiveDay(), { focus: false });
				},
			],
			onMonthChange: [announceMonthYear],
		};
	};
}

export default customElements;
