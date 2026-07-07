/**
 * Accessibility-only ESLint config — the static WCAG 2.2 AA gate.
 *
 * Runs ONLY the jsx-a11y recommended rules (as shipped — errors) so the
 * blocking CI job (`npm run lint:a11y`, .github/workflows/a11y.yml) fails
 * on accessibility regressions without being affected by unrelated lint
 * debt. The same rules are also spread into the main eslint.config.js so
 * editors surface violations during normal work.
 *
 * Every `eslint-disable jsx-a11y/*` needs a justification comment — see
 * docs/accessibility.md.
 */
import jsxA11y from "eslint-plugin-jsx-a11y";
import tsParser from "@typescript-eslint/parser";
// Registered with NO rules enabled: existing inline eslint-disable comments
// in src/ reference @typescript-eslint/* and react-hooks/* rules, and ESLint
// errors on disable directives for rules it cannot resolve. Registering the
// plugins makes those directives resolvable without linting anything extra.
import tseslint from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";

// Wrapper components mapped to the element they always render, so jsx-a11y
// can see through the library's own abstraction layer (e.g. an icon-only
// <PrimaryButton> without an accessible name is flagged like a native
// <button>). Only wrappers that statically render one element AND forward
// their props to it belong here — polymorphic ones (Typography, ActionButton
// render different elements per props) would get the wrong rules, and
// wrappers that own the relevant attributes themselves (Avatar hardcodes
// alt="") would produce false positives.
export const componentMapping = {
	Button: "button",
	PrimaryButton: "button",
	SecondaryButton: "button",
};

export default [
	{
		ignores: [
			"dist",
			"dist-demo",
			"node_modules",
			// Test-only mocks never ship; their DOM mimics third-party
			// libraries and is exercised by the runtime axe gate instead.
			"test/__mocks__",
		],
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		// Inline disables for non-a11y rules (@typescript-eslint/*, react-hooks/*)
		// are "unused" from this config's perspective but load-bearing for the
		// main eslint.config.js — don't report them here.
		linterOptions: {
			reportUnusedDisableDirectives: "off",
		},
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				ecmaFeatures: { jsx: true },
			},
		},
		plugins: {
			"jsx-a11y": jsxA11y,
			"@typescript-eslint": tseslint,
			"react-hooks": reactHooks,
		},
		settings: {
			"jsx-a11y": { components: componentMapping },
		},
		rules: {
			...jsxA11y.flatConfigs.recommended.rules,
		},
	},
];
