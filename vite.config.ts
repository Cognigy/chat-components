import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
	plugins: [react(), cssInjectedByJsPlugin()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: "./test/setup.js",
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
