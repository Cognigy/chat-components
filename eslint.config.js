import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import { componentMapping } from "./eslint.a11y.config.js";

/**
 * ESLint v9 flat config migrated from legacy .eslintrc.cjs
 * Original extends:
 *  - eslint:recommended
 *  - plugin:@typescript-eslint/recommended
 *  - plugin:react-hooks/recommended
 *
 * Additional plugins:
 *  - react-refresh
 *  - jsx-a11y
 */
export default [
	// Ignore patterns. dist-demo is the built demo bundle (npm run build:demo)
	// — generated output, same as dist. .claude/worktrees/** holds nested
	// Claude Code git worktrees (full checkouts of this repo); see the matching
	// entry in eslint.a11y.config.js.
	{
		ignores: ["dist", "dist-demo", ".claude/worktrees/**"],
	},

	// Base JS recommended rules (apply to all files)
	js.configs.recommended,

	// Node scripts (.mjs). The base recommended config enables `no-undef`,
	// which flags `console` / `process` / etc. unless Node globals are
	// declared. Legacy `/* eslint-env node */` directives are ignored under
	// flat config, so we declare the environment here instead.
	{
		files: ["**/*.mjs"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},

	// TypeScript + React Hooks + Accessibility + React Refresh rules
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				ecmaFeatures: { jsx: true },
			},
			globals: {
				...globals.browser,
				// Added explicit globals used in code (types / JSX without import)
				React: "readonly",
				TrustedHTML: "readonly",
				NodeJS: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
			"jsx-a11y": jsxA11y,
		},
		settings: {
			// See eslint.a11y.config.js — lets jsx-a11y see through the
			// library's own button wrappers.
			"jsx-a11y": { components: componentMapping },
		},
		rules: {
			// Accessibility (WCAG 2.2 AA governance — see docs/accessibility.md).
			// The same ruleset runs standalone as the blocking `lint:a11y` CI
			// gate via eslint.a11y.config.js; enabling it here too surfaces
			// violations in editors during normal work.
			...jsxA11y.flatConfigs.recommended.rules,
			// Recommended TypeScript rules
			...tseslint.configs.recommended.rules,
			// React Hooks legacy rules only
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",

			// Overrides / relaxations for existing codebase
			// TS already handles undefined vars; disable base no-undef for TS files
			"no-undef": "off",

			// Custom rules migrated from legacy config
			"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"no-redeclare": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},

	// Test-only mocks never ship; their DOM deliberately mimics third-party
	// library output (e.g. react-player's preview), so accessibility rules
	// don't apply. Mirrors the `ignores` entry in eslint.a11y.config.js.
	{
		files: ["test/__mocks__/**"],
		rules: Object.fromEntries(
			Object.keys(jsxA11y.flatConfigs.recommended.rules).map(rule => [rule, "off"]),
		),
	},
];
