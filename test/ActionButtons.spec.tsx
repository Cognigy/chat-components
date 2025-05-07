import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import buttons from "test/fixtures/action-buttons.json";
import { IMessage } from "@cognigy/socket-client";

describe("Action Buttons", () => {
	const message = buttons as unknown as IMessage;

	it("renders Action Buttons component", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByTestId("action-buttons")).toBeInTheDocument();
	});

	it("renders buttons with proper role", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByRole("list")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: /foobar005b(1|2|3|4)/ })).toHaveLength(2);
		expect(screen.getAllByRole("link", { name: /foobar005b(1|2|3|4)/ })).toHaveLength(2);
	});

	it("renders buttons in group with 'aria-label' attribute and position", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getAllByLabelText(/(1|2|3|4) of 4: foobar005b(1|2|3|4)/)).toHaveLength(4);
	});

	it("renders phone number button as anchor element with 'href' attribute", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const phoneButton = screen.getByLabelText(/4 of 4: foobar005b4/);
		expect(phoneButton).toHaveAttribute("href", "tel:000111222");
	});

	// TODO (need also to include the missing property in the components)
	//
	// it("should have static class names", async () => {});
	// it("button group should have 'aria-labelledby' attribute", async () => {});
});
