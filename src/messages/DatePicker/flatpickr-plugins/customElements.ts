import { Plugin } from "flatpickr/dist/types/options";
import { Instance } from "flatpickr/dist/types/instance";

export interface Config {
	arrowIcon: string;
}

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
				// we skip it if is already created
				const hasArrows = amPm.querySelector("span.arrowUp");
				if (!hasArrows) {
					const mode = fp?.amPM?.innerText;
					const amPmArrowUp = fp._createElement<HTMLDivElement>("span", "arrowUp", "");
					if (mode === "AM") amPmArrowUp.classList.add("disabled");
					amPmArrowUp.innerHTML = fp?.config.nextArrow;
					const amPmarrowDown = fp._createElement<HTMLDivElement>(
						"span",
						"arrowDown",
						"",
					);
					if (mode === "PM") amPmarrowDown.classList.add("disabled");
					amPmarrowDown.innerHTML = fp?.config.nextArrow;
					amPm.appendChild(amPmArrowUp);
					amPm.appendChild(amPmarrowDown);
				}
			}
		}

		function handleWeekNumbers() {
			const weekItem = fp?.weekNumbers?.getElementsByClassName("flatpickr-day");
			if (weekItem) {
				for (let index = 0; index < weekItem.length; index++) {
					// we skip it if is already created
					const weekdayInner = weekItem[index]?.getElementsByClassName("weekdayInner");
					if (weekdayInner.length === 0) {
						// TODO: check also current year
						const currentWeek = fp?.config?.getWeek(new Date()) || 0;
						weekItem[index].innerHTML = `<span class='weekdayInner${
							weekItem[index].innerHTML === currentWeek.toString()
								? " currentWeek"
								: ""
						}'>${weekItem[index].innerHTML}</span>`;
					}
				}
			}
		}

		return {
			onDayCreate: [
				handleWeekNumbers,
				(_dObj, _dStr, _fp, dayElem) => {
					dayElem.innerHTML = `<span class='dayInner'>${dayElem.innerHTML}</span>`;
				},
			],
			onReady: [
				buildTimeArrows,
				upsertTimeArrows,
				() => {
					fp.loadedPlugins.push("customElements");
				},
			],
			onValueUpdate: [upsertTimeArrows],
		};
	};
}

export default customElements;
