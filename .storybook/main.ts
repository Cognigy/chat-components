import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	docs: {
		autodocs: "tag",
	},
	core: {
		disableTelemetry: true,
	},
	async viteFinal(config) {
		return mergeConfig(config, {
			optimizeDeps: {
				include: [
					"@cognigy/socket-client",
					"classnames",
					"react",
					"react-dom",
					"react/jsx-runtime",
				],
				force: true, // Force re-optimization on every start
			},
			resolve: {
				alias: {
					src: path.resolve(__dirname, "../src"),
					test: path.resolve(__dirname, "../test"),
				},
			},
			server: {
				fs: {
					strict: false,
				},
			},
			esbuild: {
				// Ensure proper module initialization order
				keepNames: true,
			},
		});
	},
};

export default config;
