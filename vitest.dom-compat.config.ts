/**
 * Dedicated Vitest config for the DOM-compatibility spec.
 *
 * The main vite.config.ts excludes `test/layouts/dom-compat.spec.tsx`
 * from `npm test` because it has preconditions (a dist/ build and the
 * dynamically-installed `chat-components-baseline` alias) that only the
 * dom-compat workflow arranges. This config narrows `include` to that one
 * file and overrides `exclude` back to Vitest's default so the spec runs.
 *
 * We can't use `mergeConfig` with the base config because mergeConfig
 * concatenates arrays — the base config's exclude would keep the dom-compat
 * spec excluded. Instead this file restates the few fields Vitest needs
 * (plugins are a no-op at test-run time beyond react/svgr, which Vitest
 * picks up from vite.config.ts via the shared resolve config below).
 */
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	plugins: [react(), svgr()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./test/preSetup.js", "./test/setup.js"],
		include: ["test/layouts/dom-compat.spec.tsx"],
		exclude: configDefaults.exclude, // Vitest's default — no dom-compat exclusion
		css: {
			modules: {
				classNameStrategy: "non-scoped",
			},
		},
	},
	resolve: {
		alias: {
			src: "/src",
			test: "/test",
			"react-player": "/test/__mocks__/react-player.tsx",
		},
	},
});
