import { it, describe, expect } from "vitest";
import { match, MatchConfig } from "../src/matcher";
import { createElement } from "react";
import { IMessage } from "@cognigy/socket-client";

describe("Message Matcher", () => {
	it("matches text message", () => {
		const message = { text: "Hello World" } as IMessage;
		const matchResult = match(message);
		expect(matchResult[0]?.name).toBe("Text");
	});
	it("matches nothing if unknown", () => {
		const message = { text: null } as IMessage;
		const matchResult = match(message);
		expect(matchResult[0]).toBe(undefined);
	});
	it("matches with custom config", () => {
		const message = { text: null, data: { _cognigy: { _plugin: true } } } as IMessage;
		const config: MatchConfig[] = [
			{
				match: message => !!message?.data?._cognigy?._plugin,
				component: () => createElement("div", null),
				name: "component",
			},
		];
		const matchResult = match(message, undefined, config);
		console.log(matchResult);
		expect(matchResult[0]?.name).toBe("component");
	});
});
