import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import GithubActionsReporter from "vitest-github-actions-reporter";
import dts from "vite-plugin-dts";
import mkcert from'vite-plugin-mkcert'


export default defineConfig({
	plugins: [
		react(),
		cssInjectedByJsPlugin(),
		svgr(),
		dts({
			insertTypesEntry: true,
			include: ["src"],
		}),
		mkcert(),
	],
	test: {
		environment: "jsdom",
		globals: true,
		browser: {
			name: "chrome",
			enabled: true,
			headless: true,
		},
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
		target: "modules", // = es2020 edge88 firefox78 chrome87 safari14 (vite 4.4.5)
		sourcemap: true,
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
		},
	},
});
