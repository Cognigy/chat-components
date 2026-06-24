import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import singleDate from "test/fixtures/datepicker/singleDate.json";
import noTime from "test/fixtures/datepicker/noTime.json";
import range from "test/fixtures/datepicker/range.json";
import { IMessage } from "@cognigy/socket-client";
import moment from "moment";

// The single roving-focus day cell (tabindex="0").
const activeDay = (root: HTMLElement) =>
	root.querySelector<HTMLElement>('.dayContainer .flatpickr-day[tabindex="0"]');
const isFocusedDay = () =>
	(document.activeElement as HTMLElement)?.classList?.contains("flatpickr-day");

const openDialog = async (
	findByRole: (role: string) => Promise<HTMLElement>,
	getByTestId: (id: string) => HTMLElement,
) => {
	fireEvent.click(getByTestId("button-open"));
	await findByRole("dialog");
	return screen.getByTestId("datepicker-message");
};

describe("Message Datepicker", () => {
	const messageSingleDate = singleDate as unknown as IMessage;
	const messageNoTime = noTime as unknown as IMessage;
	const messageRange = range as unknown as IMessage;

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

		// click today cell in calendar (day cells use a spoken date label, e.g. "June 23, 2026")
		const todaySpoken = moment().locale("en").format("MMMM D, YYYY");
		const todayCell = getByLabelText(todaySpoken);
		expect(todayCell).toBeInTheDocument();
		fireEvent.click(todayCell);

		// today date is now selected
		const today = moment().locale("en").format("MM/DD/YYYY");
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

		// tomorrow date is selected by default (day cells use a spoken date label)
		const tomorrowSpoken = moment().add(1, "days").locale("en").format("MMMM D, YYYY");
		const tomorrowCell = getByLabelText(tomorrowSpoken);
		expect(tomorrowCell).toHaveClass("selected");
		const tomorrow = moment().add(1, "days").locale("en").format("MM/DD/YYYY");
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

	it("keeps focus on the selected day (not the time picker) when selecting via keyboard", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter", keyCode: 13 });

		// flatpickr would jump focus to the hour field after selecting; we keep it on the day.
		await waitFor(() => expect(isFocusedDay()).toBe(true));
		expect((document.activeElement as HTMLElement).classList.contains("flatpickr-hour")).toBe(
			false,
		);

		// The time field is still reachable afterwards (focus override was restored).
		const hour = root.querySelector(".flatpickr-hour") as HTMLInputElement;
		hour.focus();
		expect(document.activeElement).toBe(hour);
	});

	it("keeps focus on the selected day (not the time picker) when selecting via mouse", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const cell = root.querySelector<HTMLElement>(
			".dayContainer .flatpickr-day:not(.flatpickr-disabled):not(.prevMonthDay):not(.nextMonthDay)",
		)!;
		fireEvent.click(cell);

		await waitFor(() => expect(isFocusedDay()).toBe(true));
		expect((document.activeElement as HTMLElement).classList.contains("flatpickr-hour")).toBe(
			false,
		);
	});

	it("keeps focus on the day across both range picks", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageRange} />);
		const root = await openDialog(findByRole, getByTestId);

		// First pick.
		activeDay(root)!.focus();
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter", keyCode: 13 });
		await waitFor(() => expect(isFocusedDay()).toBe(true));

		// Move and make the second pick.
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowRight", keyCode: 39 });
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter", keyCode: 13 });
		await waitFor(() => expect(isFocusedDay()).toBe(true));

		expect(getByTestId("button-submit")).toBeEnabled();
	});

	it("keeps focus on the day when selecting in a no-time picker (no <body> drop)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageNoTime} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter", keyCode: 13 });

		await waitFor(() => expect(isFocusedDay()).toBe(true));
		expect(document.activeElement).not.toBe(document.body);
	});

	it("changing the time does not pull focus back into the calendar grid", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// Select a day, then move to the time field and change the time.
		activeDay(root)!.focus();
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter", keyCode: 13 });
		await waitFor(() => expect(isFocusedDay()).toBe(true));

		const hour = root.querySelector(".flatpickr-hour") as HTMLInputElement;
		hour.focus();
		fireEvent.click(root.querySelector(".flatpickr-time .arrowDown") as Element);

		// Focus stays in the time area; it is NOT yanked back to a day cell.
		await new Promise(resolve => setTimeout(resolve, 0));
		expect((document.activeElement as HTMLElement).closest(".flatpickr-time")).not.toBeNull();
		expect(isFocusedDay()).toBe(false);
	});
});
