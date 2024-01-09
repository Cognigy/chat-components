import { Plugin } from "flatpickr/dist/types/options";
import { Instance } from "flatpickr/dist/types/instance";

export interface Config {
	arrowIcon: string;
}

/**
 * This plugin adds some DOM elements we need for the new v3 design
 * It handles timeContainer, weekNumbers and dayElemets
 */
function customElements(pluginConfig: Config): Plugin {
	return function (fp: Instance) {
		const { arrowIcon } = pluginConfig;

		function buildTimeArrows() {
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
			const amPm = fp?.timeContainer?.querySelector("span.flatpickr-am-pm");
			if (amPm) {
				const hasArrows = amPm.querySelector("span.arrowUp");
				if (!hasArrows) {
					const mode = fp?.amPM?.innerText;
					const amPmArrowUp = fp._createElement<HTMLDivElement>("span", "arrowUp", "");
					if (mode === "AM") amPmArrowUp.classList.add("disabled");
					amPmArrowUp.innerHTML = arrowIcon;
					const amPmarrowDown = fp._createElement<HTMLDivElement>(
						"span",
						"arrowDown",
						"",
					);
					if (mode === "PM") amPmarrowDown.classList.add("disabled");
					amPmarrowDown.innerHTML = arrowIcon;
					amPm.appendChild(amPmArrowUp);
					amPm.appendChild(amPmarrowDown);
				}
			}
		}

		function handleWeekNumbers() {
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

		return {
			onReady: [
				upsertTimeArrows,
				buildTimeArrows,
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
			onValueUpdate: [upsertTimeArrows],
		};
	};
}

export default customElements;
