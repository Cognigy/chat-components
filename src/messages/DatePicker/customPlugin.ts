import { Plugin } from "flatpickr/dist/types/options";
import { Instance } from "flatpickr/dist/types/instance";

export interface Config {
	arrowIcon: string;
}

function customPlugin(pluginConfig: Config): Plugin {
	return function (fp: Instance) {
		return {
			onReady() {
				console.log("customPlugin", fp);

				const amPm = fp?.timeContainer?.querySelector("span.flatpickr-am-pm");
                if (amPm) {
                    const mode = fp?.amPM?.innerText;
                    const amPmArrowUp = fp._createElement<HTMLDivElement>("span", "arrowUp", "");
                    if(mode === "AM") amPmArrowUp.classList.add("disabled");
					amPmArrowUp.innerHTML = pluginConfig.arrowIcon;
					const amPmarrowDown = fp._createElement<HTMLDivElement>(
						"span",
						"arrowDown",
						"",
                    );
                    if(mode === "PM") amPmarrowDown.classList.add("disabled");
					amPmarrowDown.innerHTML = pluginConfig.arrowIcon;
                    amPm.appendChild(amPmArrowUp);
                    amPm.appendChild(amPmarrowDown);
				}

				const arrowUp = fp?.timeContainer?.getElementsByClassName("arrowUp");
				const arrowDown = fp?.timeContainer?.getElementsByClassName("arrowDown");

				if (arrowUp) {
					for (let index = 0; index < arrowUp.length; index++) {
						arrowUp[index].innerHTML = pluginConfig.arrowIcon;
					}
				}

				if (arrowDown) {
					for (let index = 0; index < arrowDown.length; index++) {
						arrowDown[index].innerHTML = pluginConfig.arrowIcon;
					}
				}

				fp.loadedPlugins.push("customPlugin");
			},
			onValueUpdate() {
				const amPm = fp?.timeContainer?.querySelector("span.flatpickr-am-pm");
                if (amPm) {
					// we skip it if is already created
                    const hasArrows = amPm.querySelector("span.arrowUp");
                    if (!hasArrows) {
                        const mode = fp?.amPM?.innerText;
						const amPmArrowUp = fp._createElement<HTMLDivElement>(
							"span",
							"arrowUp",
							"",
                        );
                        if(mode === "AM") amPmArrowUp.classList.add("disabled");
						amPmArrowUp.innerHTML = fp?.config.nextArrow;
						const amPmarrowDown = fp._createElement<HTMLDivElement>(
							"span",
							"arrowDown",
							"",
                        );
                        if(mode === "PM") amPmarrowDown.classList.add("disabled");
						amPmarrowDown.innerHTML = fp?.config.nextArrow;
                        amPm.appendChild(amPmArrowUp);
                        amPm.appendChild(amPmarrowDown);
					}
				}
			},
		};
	};
}

export default customPlugin;
