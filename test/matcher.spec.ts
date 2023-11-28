import { it, describe, expect } from "vitest";
import { match, MatchConfig } from "../src/matcher";
import { createElement } from "react";
import { WebchatMessage } from "../src/messages/types";

describe("Message Matcher", () => {
	it("matches text message", () => {
		const message = { text: "Hello World" } as WebchatMessage;
		const matchResult = match(message);
		expect(matchResult?.name).toBe("Text");
	});
	it("matches nothing if unknown", () => {
		const message = { text: null } as WebchatMessage;
		const matchResult = match(message);
		expect(matchResult).toBe(null);
	});
	it("matches with custom config", () => {
		const message = { text: null, data: { _cognigy: { _plugin: true } } } as WebchatMessage;
		const config: MatchConfig[] = [
			{
				rule: message => !!message?.data?._cognigy?._plugin,
				component: () => createElement("div", null),
			},
		];
		const matchResult = match(message, undefined, config);
		expect(matchResult?.name).toBe("component");
	});
});
