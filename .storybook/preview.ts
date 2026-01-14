import type { Preview } from "@storybook/react";
import { createElement } from "react";
import "../src/theme.css";
import "../src/main.module.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		backgrounds: {
			default: "light",
			values: [
				{
					name: "light",
					value: "#ffffff",
				},
				{
					name: "dark",
					value: "#333333",
				},
				{
					name: "chat-bg",
					value: "#f5f5f5",
				},
			],
		},
	},
	decorators: [
		(Story) => {
			return createElement("div", {
				style: {
					padding: "20px",
					maxWidth: "600px",
				}
			}, createElement(Story));
		}
	],
};

export default preview;
