import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("theme.css — c26 layer", () => {
	let themeCss: string;

	beforeAll(() => {
		themeCss = readFileSync(
			resolve(__dirname, "../src/theme.css"),
			"utf8",
		);
	});

	it('contains :is([data-layout="c26"]) block', () => {
		expect(themeCss).toMatch(/:is\(\[data-layout="c26"\]\)\s*\{/);
	});

	it("maps --c26-primary-color into --cc-primary-color within c26 scope", () => {
		const c26Block = themeCss.match(/:is\(\[data-layout="c26"\]\)\s*\{([\s\S]*?)\}/)?.[1] ?? "";
		expect(c26Block).toMatch(/--cc-primary-color:\s*var\(--c26-primary-color/);
	});

	it("introduces c26-only --cc-avatar-size token", () => {
		const c26Block = themeCss.match(/:is\(\[data-layout="c26"\]\)\s*\{([\s\S]*?)\}/)?.[1] ?? "";
		expect(c26Block).toMatch(/--cc-avatar-size:\s*var\(--c26-avatar-size/);
	});

	it("introduces c26-only --cc-label-color token", () => {
		const c26Block = themeCss.match(/:is\(\[data-layout="c26"\]\)\s*\{([\s\S]*?)\}/)?.[1] ?? "";
		expect(c26Block).toMatch(/--cc-label-color:\s*var\(--c26-label-color/);
	});

	it("introduces c26-only --cc-font-family token with system-ui fallback", () => {
		const c26Block = themeCss.match(/:is\(\[data-layout="c26"\]\)\s*\{([\s\S]*?)\}/)?.[1] ?? "";
		expect(c26Block).toMatch(/--cc-font-family:\s*var\(--c26-font-family/);
		expect(c26Block).toMatch(/system-ui/);
	});

	it("does NOT redefine --webchat-* public tokens in c26 block", () => {
		const c26Block = themeCss.match(/:is\(\[data-layout="c26"\]\)\s*\{([\s\S]*?)\}/)?.[1] ?? "";
		expect(c26Block).not.toMatch(/--webchat-/);
	});
});
