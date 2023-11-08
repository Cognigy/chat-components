import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import GithubActionsReporter from "vitest-github-actions-reporter";

export default defineConfig({
	plugins: [react(), cssInjectedByJsPlugin()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: "./test/setup.js",
		reporters: process.env.GITHUB_ACTIONS
			? ["default", new GithubActionsReporter()]
			: "default",
	},
	build: {
		target: "modules", // = es2020 edge88 firefox78 chrome87 safari14 (vite 4.4.5)
		sourcemap: true,
		minify: false,
		lib: {
			entry: "src/index.ts",
			name: "chat-components",
			formats: ["es"],
		},
		rollupOptions: {
			output: {
				format: "es",
			},
		},
	},
});
