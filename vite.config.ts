import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import GithubActionsReporter from "vitest-github-actions-reporter";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [
		react(),
		cssInjectedByJsPlugin(),
		svgr(),
		dts({
			insertTypesEntry: true,
			include: ["src"],
		}),
	],
	test: {
		environment: "jsdom",
		globals: true,
		// Removed browser configuration due to unsupported headless preview provider error
		setupFiles: ["./test/preSetup.js", "./test/setup.js"],
		css: {
			modules: {
				classNameStrategy: "non-scoped",
			},
		},
		reporters: process.env.GITHUB_ACTIONS
			? ["default", new GithubActionsReporter()]
			: "default",
	},
	build: {
		target: "es2020",
		sourcemap: "hidden",
		minify: false,
		lib: {
			entry: "src/index.ts",
			name: "chat-components",
			formats: ["es"],
		},
		rollupOptions: {
			external: ["react", "react-dom"],
			output: {
				format: "es",
				inlineDynamicImports: true,
				globals: {
					react: "React",
					"react-dom": "ReactDOM",
				},
			},
		},
	},
	resolve: {
		alias: {
			src: "/src",
			test: "/test",
			// Use local mock for react-player during Vitest runs
			"react-player": process.env.VITEST
				? "/test/__mocks__/react-player.tsx"
				: "react-player",
		},
	},
});
