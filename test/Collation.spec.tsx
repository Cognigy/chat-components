import { render } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "../src/messages/Message";
import { IMessage } from "@cognigy/socket-client";

describe("Collation", () => {
	it("collates if timestamp is in limit", () => {
		const message1: IMessage = {
			text: "Hello",
			source: "bot",
			timestamp: String(Date.now() - 1000 * 50),
		};
		const message2: IMessage = {
			text: "World",
			source: "bot",
			timestamp: String(Date.now()),
		};

		const { getAllByTestId } = render(
			<>
				<Message message={message1} />
				<Message message={message2} prevMessage={message1} />
			</>,
		);

		const messageHeaders = getAllByTestId("message-header");
		expect(messageHeaders).toHaveLength(1);
	});

	it("does NOT collate if timestamp is NOT in limit", () => {
		const message1: IMessage = {
			text: "Hello",
			source: "bot",
			timestamp: String(Date.now() - 1000 * 120),
		};
		const message2: IMessage = {
			text: "World",
			source: "bot",
			timestamp: String(Date.now()),
		};

		const { getAllByTestId } = render(
			<>
				<Message message={message1} />
				<Message message={message2} prevMessage={message1} />
			</>,
		);

		const messageHeaders = getAllByTestId("message-header");
		expect(messageHeaders).toHaveLength(2);
	});

	it("does NOT collate if source is different", () => {
		const message1: IMessage = {
			text: "Hello",
			source: "bot",
			timestamp: String(Date.now() - 1000),
		};
		const message2: IMessage = {
			text: "World",
			source: "user",
			timestamp: String(Date.now()),
		};

		const { getAllByTestId } = render(
			<>
				<Message message={message1} />
				<Message message={message2} prevMessage={message1} />
			</>,
		);

		const messageHeaders = getAllByTestId("message-header");
		expect(messageHeaders).toHaveLength(2);
	});

	it("collates multiple if all are in limit", () => {
		const message1: IMessage = { text: "Hello", source: "user", timestamp: String(Date.now()) };
		const message2: IMessage = {
			text: "World",
			source: "user",
			timestamp: String(Date.now()),
		};
		const message3: IMessage = {
			text: "World2",
			source: "user",
			timestamp: String(Date.now()),
		};
		const message4: IMessage = {
			text: "World3",
			source: "user",
			timestamp: String(Date.now()),
		};

		const { getAllByTestId } = render(
			<>
				<Message message={message1} />
				<Message message={message2} prevMessage={message1} />
				<Message message={message3} prevMessage={message2} />
				<Message message={message4} prevMessage={message3} />
			</>,
		);

		const messageHeaders = getAllByTestId("message-header");
		expect(messageHeaders).toHaveLength(1);
	});

	it("handles collation with empty messages correctly", () => {
		const userMessage: IMessage = {
			text: "hi",
			source: "user",
			timestamp: String(Date.now())
		};
		const botMessage1: IMessage = {
			source: "bot",
			data: {  },
			timestamp: String(Date.now())
		};
		const botMessage2: IMessage = {
			text: "Hello there!",
			source: "bot",
			timestamp: String(Date.now())
		};
		const botMessage3: IMessage = {
			source: "bot",
			data: {  },
			timestamp: String(Date.now())
		};
		const botMessage4: IMessage = {
			text: "How can I help you?",
			source: "bot",
			timestamp: String(Date.now())
		};

		const { getAllByTestId } = render(
			<>
				<Message message={userMessage} />
				<Message message={botMessage1} prevMessage={userMessage} />
				<Message message={botMessage2} prevMessage={botMessage1} />
				<Message message={botMessage3} prevMessage={botMessage2} />
				<Message message={botMessage4} prevMessage={botMessage3} />
			</>
		);

		const messageHeaders = getAllByTestId("message-header");
		expect(messageHeaders).toHaveLength(2);
	});
});
