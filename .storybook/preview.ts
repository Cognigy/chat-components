import type { Preview } from "@storybook/react";
import React from "react";
import "./setup"; // Pre-import modules in correct order
import "../src/theme.css";
import "../src/main.module.css";

// Import CollationProvider to wrap all stories
const CollationProvider = React.lazy(() => 
	import("../src/messages/collation").then(module => ({
		default: module.CollationProvider
	}))
);

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
		(Story) => 
			React.createElement(
				React.Suspense,
				{ fallback: React.createElement("div", null, "Loading...") },
				React.createElement(
					CollationProvider,
					null,
					React.createElement(
						"div",
						{
							style: {
								padding: "20px",
								maxWidth: "600px",
							},
						},
						React.createElement(Story)
					)
				)
			),
	],
};

export default preview;
