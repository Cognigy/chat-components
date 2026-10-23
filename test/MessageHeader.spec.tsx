import { render } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import type { IMessage } from "@cognigy/socket-client";
import type { IWebchatConfig } from "src/messages/types";
import { expectNoA11yViolations } from "./a11y-utils";

// CGY-3745: customTranslations.dateLocale sets the language of the message time
describe("MessageHeader - customTranslations.dateLocale", () => {
	// 14:05 local time: "14:05" in German, "02:05 PM" in US English
	const timestamp = new Date(2026, 0, 15, 14, 5).getTime();

	const message: IMessage = {
		text: "Hallo",
		source: "bot",
		timestamp: String(timestamp),
	};

	const configWith = (customTranslations: Record<string, unknown>) =>
		({ settings: { customTranslations } }) as unknown as IWebchatConfig;

	const browserLocaleTime = new Date(timestamp).toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});

	const renderHeader = (config?: IWebchatConfig) => {
		const { getByTestId, container } = render(<Message message={message} config={config} />);
		const header = getByTestId("message-header");
		return {
			container,
			time: header.querySelector("time")!,
			srLabel: header.querySelector("[data-skip-live-region]")!,
		};
	};

	it("formats the time in the configured locale and marks its language", () => {
		const { time, srLabel } = renderHeader(configWith({ dateLocale: "de" }));

		expect(time).toHaveTextContent("14:05");
		expect(time).toHaveAttribute("lang", "de");

		// The template stays in the page language; only the time is marked (SC 3.1.2)
		expect(srLabel).toHaveTextContent("At 14:05,");
		expect(srLabel).not.toHaveAttribute("lang");
		expect(srLabel.querySelector("span[lang='de']")).toHaveTextContent("14:05");
	});

	it("keeps a translated timestamp template around the localized time", () => {
		const { time, srLabel } = renderHeader(
			configWith({
				dateLocale: "en-US",
				ariaLabels: { messageHeader: { timestamp: "Um {time} Uhr," } },
			}),
		);

		expect(time).toHaveTextContent("02:05 PM");
		expect(srLabel).toHaveTextContent("Um 02:05 PM Uhr,");
		expect(srLabel.querySelector("span[lang='en-US']")).toHaveTextContent("02:05 PM");
	});

	it("canonicalizes the tag", () => {
		const { time } = renderHeader(configWith({ dateLocale: " DE-de " }));

		expect(time).toHaveAttribute("lang", "de-DE");
		expect(time).toHaveTextContent("14:05");
	});

	it.each([
		["unset", {}],
		["empty", { dateLocale: "" }],
		["invalid", { dateLocale: "not a locale!" }],
	])("falls back to the browser locale with unchanged markup when %s", (_, translations) => {
		const { time, srLabel } = renderHeader(configWith(translations));

		expect(time).toHaveTextContent(browserLocaleTime);
		expect(time).not.toHaveAttribute("lang");
		// Plain text, as before the setting existed (DOM compatibility)
		expect(srLabel.children).toHaveLength(0);
		expect(srLabel).toHaveTextContent(`At ${browserLocaleTime},`);
	});

	it("has no axe violations with a configured locale", async () => {
		const { container } = renderHeader(configWith({ dateLocale: "de" }));

		await expectNoA11yViolations(container);
	});
});
