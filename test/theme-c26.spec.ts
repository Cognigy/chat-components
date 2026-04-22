import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("theme.css — c26 layer", () => {
	let themeCss: string;
	let c26Block: string;

	beforeAll(() => {
		themeCss = readFileSync(resolve(__dirname, "../src/theme.css"), "utf8");
		c26Block = themeCss.match(/:is\(\[data-layout="c26"\]\)\s*\{([\s\S]*?)\}/)?.[1] ?? "";
	});

	it('contains :is([data-layout="c26"]) block', () => {
		expect(themeCss).toMatch(/:is\(\[data-layout="c26"\]\)\s*\{/);
	});

	it("maps --c26-primary-color into --cc-primary-color within c26 scope", () => {
		expect(c26Block).toMatch(/--cc-primary-color:\s*var\(--c26-primary-color/);
	});

	it("introduces c26-only --cc-avatar-size token", () => {
		expect(c26Block).toMatch(/--cc-avatar-size:\s*var\(--c26-avatar-size/);
	});

	it("introduces c26-only --cc-label-color token", () => {
		expect(c26Block).toMatch(/--cc-label-color:\s*var\(--c26-label-color/);
	});

	it("introduces c26-only --cc-font-family token with system-ui fallback", () => {
		expect(c26Block).toMatch(/--cc-font-family:\s*var\(--c26-font-family/);
		expect(c26Block).toMatch(/system-ui/);
	});

	it("does NOT redefine --webchat-* public tokens in c26 block", () => {
		expect(c26Block).not.toMatch(/--webchat-/);
	});

	it("maps --cc-background-user-message to --primary-25 (was --neutral-50)", () => {
		expect(c26Block).toMatch(/--cc-background-user-message:\s*var\(--c26-background-user-message,\s*var\(--primary-25/);
	});

	it("sets --cc-avatar-size default to 40px", () => {
		expect(c26Block).toMatch(/--cc-avatar-size:\s*var\(--c26-avatar-size,\s*40px\)/);
	});

	it("defines --cc-bubble-box-shadow via UCL --shadow-sm", () => {
		expect(c26Block).toMatch(/--cc-bubble-box-shadow:\s*var\(--c26-bubble-box-shadow,\s*var\(--shadow-sm/);
	});

	it("defines role-differentiated bubble max-width tokens", () => {
		expect(c26Block).toMatch(/--cc-bubble-max-width-bot:\s*var\(--c26-bubble-max-width-bot,\s*min\(80%,\s*480px\)\)/);
		expect(c26Block).toMatch(/--cc-bubble-max-width-user:\s*var\(--c26-bubble-max-width-user,\s*min\(70%,\s*320px\)\)/);
	});

	it("defines glass-variant button tokens", () => {
		expect(c26Block).toMatch(/--cc-button-background:\s*var\(--c26-button-background,\s*rgba\(255,\s*255,\s*255,\s*0\.18\)\)/);
		expect(c26Block).toMatch(/--cc-button-color:\s*var\(--c26-button-color,\s*#ffffff\)/);
		expect(c26Block).toMatch(/--cc-button-hover-background:\s*var\(--c26-button-hover-background,\s*rgba\(255,\s*255,\s*255,\s*0\.28\)\)/);
		expect(c26Block).toMatch(/--cc-button-border:\s*var\(--c26-button-border,\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.25\)\)/);
		expect(c26Block).toMatch(/--cc-button-hover-border:\s*var\(--c26-button-hover-border,\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.40\)\)/);
		expect(c26Block).toMatch(/--cc-button-backdrop-filter:\s*var\(--c26-button-backdrop-filter,\s*blur\(4px\)\)/);
	});

	it("defines --cc-bubble-max-width as a temporary alias to bot cap (removed in Task 2)", () => {
		// C26Layout.module.css:115 still reads --cc-bubble-max-width. Until Task 2
		// rewrites that file to use the role-differentiated tokens directly, we
		// expose an alias so the intermediate state does not regress bubble sizing.
		expect(c26Block).toMatch(/--cc-bubble-max-width:\s*var\(--cc-bubble-max-width-bot\)/);
	});
});
