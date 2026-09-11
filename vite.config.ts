import { defineConfig, configDefaults } from "vitest/config";
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
		exclude: [
			...configDefaults.exclude,
			// The dom-compat spec is excluded from the default `npm test` run
			// because it has preconditions (a production `dist/` build and the
			// dynamically-installed `chat-components-baseline` alias) that only
			// the dedicated dom-compat workflow / `npm run test:dom-compat`
			// script arrange. vitest.dom-compat.config.ts narrows `include` to
			// specifically that file for the dedicated run.
			"test/dom-compat.spec.tsx",
			// Nested Claude Code git worktrees (.claude/worktrees/<name>) are
			// full checkouts of this repo, so their specs match Vitest's default
			// `include` glob and get collected on top of the real suite — the
			// root-anchored dom-compat pattern above doesn't cover their copy
			// either. They also carry their own node_modules, so the duplicate
			// React copy makes every collected rendering spec fail ("Cannot read
			// properties of null (reading 'useContext')"). CI never hits this —
			// fresh checkout, no nested worktrees — so exclude them to keep
			// local runs matching CI.
			"**/.claude/worktrees/**",
		],
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
			external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
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
