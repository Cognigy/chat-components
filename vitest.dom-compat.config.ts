/**
 * Dedicated Vitest config for the DOM-compatibility spec.
 *
 * The main vite.config.ts excludes `test/dom-compat.spec.tsx`
 * from `npm test` because it has preconditions (a dist/ build and the
 * dynamically-installed `chat-components-baseline` alias) that only the
 * dom-compat workflow arranges. This config narrows `include` to that one
 * file and overrides `exclude` back to Vitest's default so the spec runs.
 *
 * We can't use `mergeConfig` with the base config because mergeConfig
 * concatenates arrays — the base config's exclude would keep the dom-compat
 * spec excluded. And `vitest --config vitest.dom-compat.config.ts` does not
 * automatically merge in vite.config.ts, so this file must restate every
 * field Vitest needs to run the spec: the react / svgr plugins, the
 * jsdom-environment + setup files, the CSS-module non-scoped strategy, and
 * the resolve aliases used by the spec and its fixtures.
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
		include: ["test/dom-compat.spec.tsx"],
		// Vitest's default — no dom-compat exclusion — plus the nested Claude
		// Code worktrees guard from vite.config.ts. `include` above is already
		// root-anchored, so this is belt-and-braces against a future widening.
		exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
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
