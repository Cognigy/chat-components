import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

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
	// Ignore patterns
	{
		ignores: ["dist", ".eslintrc.cjs"],
	},

	// Base JS recommended rules (apply to all files)
	js.configs.recommended,

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
		rules: {
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
		},
	},
];
