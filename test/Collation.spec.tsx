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
		const botMessage1: IMessage = {
			text: "First message always has a header",
			source: "bot",
			timestamp: "1701163314138",
		};
		const botMessage2: IMessage = {
			text: "This message does not have a header",
			source: "bot",
			timestamp: "1701163319138",
		};
		const botMessage3: IMessage = {
			text: "This message has a new a header",
			source: "agent",
			timestamp: "1701163314138",
		};
		const botMessage4: IMessage = {
			text: "Has header",
			source: "bot",
			timestamp: "1701163319000",
		};

		const botMessage5: IMessage = {
			text: "",
			//@ts-expect-error
			data: { _some: "" },
			source: "bot",
			timestamp: "1701163319111",
		};

		const botMessage6: IMessage = {
			text: "Has NO header",
			//@ts-expect-error
			data: { _some: "" },
			source: "bot",
			timestamp: "1701163319222",
		};
		const userMessage1: IMessage = {
			text: "Help me find the id",
			source: "user",
			timestamp: String(Date.now()),
		};

		const { getAllByTestId } = render(
			<>
				<Message message={botMessage1} />
				<Message message={botMessage2} prevMessage={botMessage1} />
				<Message message={botMessage3} prevMessage={botMessage2} />
				<Message message={botMessage4} prevMessage={botMessage3} />
				<Message message={userMessage1} prevMessage={botMessage4} />
				<Message message={botMessage5} prevMessage={userMessage1} />
				<Message message={botMessage6} prevMessage={botMessage5} />
			</>,
		);

		const messageHeaders = getAllByTestId("message-header");
		expect(messageHeaders).toHaveLength(5);
	});
});
