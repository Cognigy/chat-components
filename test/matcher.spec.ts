import { it, describe, expect } from "vitest";
import { match, MatchConfig } from "../src/matcher";
import { createElement } from "react";

describe("Message Matcher", () => {
	it("matches text message", () => {
		const message = { text: "Hello World" };
		const matchResult = match(message);
		expect(matchResult.name).toBe("Text");
	});
	it("matches nothing if unknown", () => {
		const message = { text: null, __bogus: {} };
		const matchResult = match(message);
		expect(matchResult).toBe(null);
	});
	it("matches with custom config", () => {
		const message = { text: null, __plugin: true };
		const config: MatchConfig[] = [
			{
				rule: (message: any) => message.__plugin,
				component: createElement("div", null),
			},
		];
		const matchResult = match(message, config);
		expect(matchResult.type).toBe("div");
	});
});
