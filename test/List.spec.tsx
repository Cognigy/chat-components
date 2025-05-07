import { render } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import list from "test/fixtures/list.json";
import { IMessage } from "@cognigy/socket-client";

describe("Message List", () => {
	const message = list as unknown as IMessage;

	it("renders List message", () => {
		const { getByTestId } = render(<Message message={message} />);

		expect(getByTestId("list-message")).toBeInTheDocument();
	});

	it("renders List message with large header", () => {
		const { getByTestId, getAllByTestId } = render(<Message message={message} />);

		expect(getByTestId("header-image")).toBeInTheDocument();
		expect(getAllByTestId("regular-image")).toHaveLength(2);
	});

	it("renders top element of the list small", () => {
		list.data._cognigy._webchat.message.attachment.payload.top_element_style = "compact";

		const { queryByTestId, getAllByTestId } = render(<Message message={message} />);

		expect(queryByTestId("header-image")).not.toBeInTheDocument();
		expect(getAllByTestId("regular-image")).toHaveLength(3);
		list.data._cognigy._webchat.message.attachment.payload.top_element_style = "large";
	});

	it("renders 'global' button", async () => {
		const { getByText } = render(<Message message={message} />);

		expect(getByText("Global Button")).toBeInTheDocument();
	});

	it("should have static class names", () => {
		render(<Message message={message} />);

		expect(document.querySelector(".webchat-list-template-root")).toBeInTheDocument();
		expect(document.querySelector(".webchat-list-template-header")).toBeInTheDocument();
		expect(document.querySelector(".webchat-list-template-header-content")).toBeInTheDocument();
		expect(document.querySelector(".webchat-list-template-header-title")).toBeInTheDocument();
		expect(
			document.querySelector(".webchat-list-template-header-subtitle"),
		).toBeInTheDocument();
		expect(document.querySelector(".webchat-list-template-header-button")).toBeInTheDocument();
		expect(document.querySelector(".webchat-list-template-element")).toBeInTheDocument();
		expect(
			document.querySelector(".webchat-list-template-element-content"),
		).toBeInTheDocument();
		expect(document.querySelector(".webchat-list-template-element-title")).toBeInTheDocument();
		expect(
			document.querySelector(".webchat-list-template-element-subtitle"),
		).toBeInTheDocument();
		expect(document.querySelector(".webchat-list-template-element-button")).toBeInTheDocument();
	});

	it("renders list and list items with correct roles", () => {
		const { getByRole, getAllByRole } = render(<Message message={message} />);

		expect(getByRole("list")).toBeInTheDocument();
		expect(getAllByRole("listitem")).toHaveLength(4); // Header element is not a list item
	});
});
