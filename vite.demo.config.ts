import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	base: "/chat-components/",
	plugins: [react(), svgr()],
	build: {
		outDir: "dist-demo",
		emptyOutDir: true,
		target: "es2020",
		sourcemap: true,
	},
	resolve: {
		alias: {
			src: "/src",
			test: "/test",
		},
	},
});
