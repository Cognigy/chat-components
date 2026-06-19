import { render, screen, fireEvent } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import singleDate from "test/fixtures/datepicker/singleDate.json";
import { IMessage } from "@cognigy/socket-client";

describe("DatePicker Accessibility (Issues A, B, C, E)", () => {
	const messageSingleDate = singleDate as unknown as IMessage;

	it("Issue A - announces month/year changes via aria-live region", async () => {
		const { getByTestId, findByRole } = render(
			<Message message={messageSingleDate} />,
		);

		const openButton = getByTestId("button-open");
		fireEvent.click(openButton);

		await findByRole("dialog");

		// Check aria-live region exists
		const liveRegion = screen
			.getByTestId("datepicker-message")
			.querySelector('[aria-live="polite"]');
		expect(liveRegion).toBeInTheDocument();
		expect(liveRegion).toHaveAttribute("role", "status");
		expect(liveRegion).toHaveAttribute("aria-atomic", "true");
	});

	it("Issue B - grid has aria-label and aria-description", async () => {
		const { getByTestId, findByRole } = render(
			<Message message={messageSingleDate} />,
		);

		const openButton = getByTestId("button-open");
		fireEvent.click(openButton);

		await findByRole("dialog");

		const daysGrid = screen
			.getByTestId("datepicker-message")
			.querySelector(".flatpickr-innerContainer");
		expect(daysGrid).toHaveAttribute("aria-label");
		expect(daysGrid?.getAttribute("aria-label")).toBe("Calendar");
		expect(daysGrid).toHaveAttribute("aria-description");
		expect(daysGrid?.getAttribute("aria-description")).toContain("arrow keys");
	});

	it("Issue B - weekday headers have role and abbr", async () => {
		const { getByTestId, findByRole } = render(
			<Message message={messageSingleDate} />,
		);

		const openButton = getByTestId("button-open");
		fireEvent.click(openButton);

		await findByRole("dialog");

		const weekdays = screen
			.getByTestId("datepicker-message")
			.querySelectorAll(".flatpickr-weekday");
		expect(weekdays.length).toBeGreaterThan(0);

		weekdays.forEach(weekday => {
			expect(weekday).toHaveAttribute("role", "columnheader");
			expect(weekday).toHaveAttribute("abbr");
		});
	});

	it("Issue C - days grid has role='grid' for interactive announcement", async () => {
		const { getByTestId, findByRole } = render(
			<Message message={messageSingleDate} />,
		);

		const openButton = getByTestId("button-open");
		fireEvent.click(openButton);

		await findByRole("dialog");

		const daysGrid = screen
			.getByTestId("datepicker-message")
			.querySelector(".flatpickr-innerContainer");
		expect(daysGrid).toHaveAttribute("role", "grid");
	});

	it("Issue E - a day cell is made focusable and keyboard-navigable", async () => {
		const { getByTestId, findByRole } = render(
			<Message message={messageSingleDate} />,
		);

		const openButton = getByTestId("button-open");
		fireEvent.click(openButton);

		await findByRole("dialog");

		const calendarContainer = screen.getByTestId("datepicker-message");

		// Check that day elements have tabindex (all -1 for aria-activedescendant pattern)
		const dayElements = calendarContainer.querySelectorAll(".flatpickr-day");
		expect(dayElements.length).toBeGreaterThan(0);

		dayElements.forEach(day => {
			// Each day should have tabindex="-1" in aria-activedescendant pattern
			expect(day).toHaveAttribute("tabindex", "-1");
		});

		// Grid container should have aria-activedescendant pointing to active day
		const daysGrid = calendarContainer.querySelector(".flatpickr-innerContainer");
		expect(daysGrid).toHaveAttribute("aria-activedescendant");

		const activeDayId = daysGrid?.getAttribute("aria-activedescendant");
		expect(activeDayId).toBeTruthy();

		// The element referenced by aria-activedescendant should exist
		const activeDay = calendarContainer.querySelector(`#${activeDayId}`);
		expect(activeDay).toBeInTheDocument();
	});
});
