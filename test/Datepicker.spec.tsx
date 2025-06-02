import { fireEvent, render, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import singleDate from "test/fixtures/datepicker/singleDate.json";
import noTime from "test/fixtures/datepicker/noTime.json";
import { IMessage } from "@cognigy/socket-client";
import moment from "moment";

describe("Message Datepicker", () => {
	const messageSingleDate = singleDate as unknown as IMessage;
	const messageNoTime = noTime as unknown as IMessage;

	it("renders datepicker message", async () => {
		const { getByTestId } = render(<Message message={messageSingleDate} />);

		expect(getByTestId("datepicker-message")).toBeInTheDocument();

		const openButton = getByTestId("button-open");

		expect(openButton).toBeInTheDocument();
	});

	it("renders datepicker calendar dialog", async () => {
		const { getByTestId, queryByRole, findByRole } = render(
			<Message message={messageSingleDate} />,
		);

		expect(getByTestId("datepicker-message")).toBeInTheDocument();

		const openButton = getByTestId("button-open");

		expect(queryByRole("dialog")).not.toBeInTheDocument();

		fireEvent.click(openButton);

		expect(await findByRole("dialog")).toBeInTheDocument();
	});

	it("is possible to select a date and submit", async () => {
		const { getByTestId, findByRole, queryByRole, getByLabelText } = render(
			<Message message={messageSingleDate} />,
		);

		expect(getByTestId("datepicker-message")).toBeInTheDocument();

		// open calendar dialog
		const openButton = getByTestId("button-open");
		fireEvent.click(openButton);
		expect(await findByRole("dialog")).toBeInTheDocument();
		const submitButton = getByTestId("button-submit");
		expect(submitButton).toBeDisabled();

		// no date is selected by default
		const input = screen.getByTestId("datepicker-message").querySelector(".flatpickr-input");
		expect(input).toHaveValue("");

		// click today cell in calendar
		const today = moment().locale("en").format("MM/DD/YYYY");
		const todayCell = getByLabelText(`${today} 12:00 AM`);
		expect(todayCell).toBeInTheDocument();
		fireEvent.click(todayCell);

		// today date is now selected
		expect(input).toHaveValue(`${today} 12:30 PM`);

		// interact time inputs
		const timeContainerArrowDown = screen
			.getByTestId("datepicker-message")
			.querySelector(".flatpickr-time .arrowDown");
		expect(timeContainerArrowDown).toBeInTheDocument();
		fireEvent.click(timeContainerArrowDown as Element);
		expect(input).toHaveValue(`${today} 11:30 AM`);

		// submit selection
		expect(submitButton).toBeEnabled();
		fireEvent.click(submitButton);

		// dialog closed
		expect(queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("is possible to define default date and disable dates", async () => {
		const { getByTestId, findByRole, getByLabelText, queryByRole } = render(
			<Message message={messageNoTime} />,
		);

		expect(getByTestId("datepicker-message")).toBeInTheDocument();

		// open calendar dialog
		const openButton = getByTestId("button-open");
		fireEvent.click(openButton);
		expect(await findByRole("dialog")).toBeInTheDocument();

		// time inputs are missing
		const timeContainer = screen
			.getByTestId("datepicker-message")
			.querySelector(".flatpickr-time");
		expect(timeContainer).not.toBeInTheDocument();

		// tomorrow date is selected by default
		const tomorrow = moment().add(1, "days").locale("en").format("MM/DD/YYYY");
		const tomorrowCell = getByLabelText(tomorrow);
		expect(tomorrowCell).toHaveClass("selected");
		const input = screen.getByTestId("datepicker-message").querySelector(".flatpickr-input");
		expect(input).toHaveValue(tomorrow);

		// day before yesterday is disabled
		// const yesterday = moment().add(-2, "days").locale("en").format("MM/DD/YYYY");
		// const yesterdayCell = getByLabelText(yesterday);
		// expect(yesterdayCell).toHaveClass("flatpickr-disabled");

		// submit selection
		const submitButton = getByTestId("button-submit");
		expect(submitButton).toBeEnabled();
		fireEvent.click(submitButton);

		// dialog closed
		expect(queryByRole("dialog")).not.toBeInTheDocument();
	});
});
