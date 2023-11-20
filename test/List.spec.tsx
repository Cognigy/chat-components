import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import list from "test/fixtures/list.json";

describe("Message List", () => {
	it("renders List message", async () => {
		await waitFor(() => {
			render(<Message message={list} />);
		});

		expect(screen.getByTestId("list-message")).toBeInTheDocument();
	});

	it("renders List message with large header", async () => {
		await waitFor(() => {
			render(<Message message={list} />);
		});

		expect(screen.getByTestId("header-image")).toBeInTheDocument();
		expect(screen.getAllByTestId("regular-image")).toHaveLength(2);
	});

	it("renders top element of the list small", async () => {
		list.data._cognigy._webchat.message.attachment.payload.top_element_style = "compact";
		await waitFor(() => {
			render(<Message message={list} />);
		});

		expect(screen.queryByTestId("header-image")).not.toBeInTheDocument();
		expect(screen.getAllByTestId("regular-image")).toHaveLength(3);
		list.data._cognigy._webchat.message.attachment.payload.top_element_style = "large";
	});

	it("renders 'global' button", async () => {
		await waitFor(() => {
			render(<Message message={list} />);
		});

		expect(screen.getByText("Global Button")).toBeInTheDocument();
	});

	it("should have static class names", async () => {
		await waitFor(() => {
			render(<Message message={list} />);
		});

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

	it("renders list and list items with correct roles", async () => {
		await waitFor(() => {
			render(<Message message={list} />);
		});

		expect(screen.getByRole("list")).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(5);
	});

	// TODO: make module css working
	// it("renders list header image in a fixed aspect ratio", async () => {
	// 	await waitFor(() => {
	// 		render(<Message message={list} />);
	// 	});

	// 	const image = screen.queryByTestId("header-image") as Element;
	// 	// const compStyles = window.getComputedStyle(image);

	// 	expect(image).toHaveStyle({ aspectRatio: "16/9" });
	// });
});
