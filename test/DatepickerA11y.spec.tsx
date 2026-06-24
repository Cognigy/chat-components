import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import singleDate from "test/fixtures/datepicker/singleDate.json";
import { IMessage } from "@cognigy/socket-client";

const openDialog = async (
	findByRole: (role: string) => Promise<HTMLElement>,
	getByTestId: (id: string) => HTMLElement,
) => {
	fireEvent.click(getByTestId("button-open"));
	await findByRole("dialog");
	return screen.getByTestId("datepicker-message");
};

// The single roving-focus day cell (tabindex="0").
const activeDay = (root: HTMLElement) =>
	root.querySelector<HTMLElement>('.flatpickr-day[tabindex="0"]');

// In-grid day cells of the visible month grid (the 42 cells inside .dayContainer).
const getDayCells = (root: HTMLElement) =>
	Array.from(root.querySelectorAll<HTMLElement>(".dayContainer .flatpickr-day"));

// flatpickr stores the real Date for each day cell on `dateObj`.
const dateOf = (cell: Element | null) =>
	(cell as unknown as { dateObj?: Date } | null)?.dateObj;

// Dispatch a keydown carrying a real keyCode. Flatpickr's native arrow navigation reads
// e.keyCode, so arrow tests must set it (Testing Library's keyDown leaves keyCode at 0).
const KEY_CODES: Record<string, number> = {
	Tab: 9,
	Enter: 13,
	End: 35,
	Home: 36,
	ArrowLeft: 37,
	ArrowUp: 38,
	ArrowRight: 39,
	ArrowDown: 40,
	PageUp: 33,
	PageDown: 34,
};
const pressKey = (key: string, shiftKey = false) => {
	const el = document.activeElement as HTMLElement;
	el.dispatchEvent(
		new KeyboardEvent("keydown", {
			key,
			keyCode: KEY_CODES[key],
			shiftKey,
			bubbles: true,
			cancelable: true,
		} as KeyboardEventInit),
	);
};
const focusedLabel = () => (document.activeElement as HTMLElement)?.getAttribute("aria-label");

// The suite runs on real timers, and several accessibility behaviors are async:
//  - the focused cell's aria-label is toggled (blanked, then restored on the next tick) so NVDA
//    re-reads the date on every focus;
//  - selecting a day refocuses it on a microtask (after flatpickr's own focus moves).
// So assertions that read the restored aria-label / final focus must wait, not read synchronously.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe("DatePicker Accessibility (W3C APG grid pattern)", () => {
	const messageSingleDate = singleDate as unknown as IMessage;

	it("Issue A - announces via an assertive live region; month nav updates it", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// The live region is assertive so the focused date interrupts/queues past NVDA's grid
		// context and is spoken on every entry (a polite region was dropped on re-entry).
		const liveRegion = root.querySelector("[aria-live]");
		expect(liveRegion).toBeInTheDocument();
		expect(liveRegion).toHaveAttribute("aria-live", "assertive");
		expect(liveRegion).toHaveAttribute("role", "alert");
		expect(liveRegion).toHaveAttribute("aria-atomic", "true");

		// Changing the month via the nav button announces the new "Month Year" via the live region.
		fireEvent.click(root.querySelector(".flatpickr-next-month") as Element);
		await waitFor(() => expect(liveRegion?.textContent).toMatch(/^[A-Za-z]+ \d{4}$/));
	});

	it("Issue B - grid has role/label/description/counts and weekday columnheaders", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// role="grid" lives on the rContainer (wraps the weekday row + day grid).
		const grid = root.querySelector(".flatpickr-rContainer");
		expect(grid).toHaveAttribute("role", "grid");
		expect(grid?.getAttribute("aria-label")).toBe("Calendar");
		expect(grid?.getAttribute("aria-description")).toContain("arrow keys");
		expect(grid).toHaveAttribute("aria-colcount", "7");
		expect(grid).toHaveAttribute("aria-rowcount", "7"); // 1 weekday header row + 6 week rows

		// Weekday headers are columnheaders (aria-colindex 1-7) within the header row.
		const weekdayRow = root.querySelector(".flatpickr-weekdays");
		expect(weekdayRow).toHaveAttribute("role", "row");
		expect(weekdayRow).toHaveAttribute("aria-rowindex", "1");
		const weekdays = root.querySelectorAll(".flatpickr-weekday");
		expect(weekdays.length).toBeGreaterThan(0);
		weekdays.forEach((weekday, i) => {
			expect(weekday).toHaveAttribute("role", "columnheader");
			expect(weekday).toHaveAttribute("abbr");
			expect(weekday).toHaveAttribute("aria-colindex", String(i + 1));
		});
	});

	it("Issue C - day cells are flat gridcells with row/column indices (no physical rows)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const dayContainer = root.querySelector(".dayContainer");
		expect(dayContainer).toHaveAttribute("role", "rowgroup");

		// Day cells are flat direct children (NOT wrapped in physical role="row" elements), so
		// flatpickr's native arrow navigation can index them; grid position is conveyed via
		// aria-rowindex / aria-colindex instead.
		expect(dayContainer?.querySelectorAll('[role="row"]').length).toBe(0);

		const days = getDayCells(root);
		expect(days.length).toBe(42);
		days.forEach((day, i) => {
			expect(day).toHaveAttribute("role", "gridcell"); // not presentation -> NVDA tracks it
			// Day rows start at grid row 2 (row 1 is the weekday header).
			expect(day).toHaveAttribute("aria-rowindex", String(Math.floor(i / 7) + 2));
			expect(day).toHaveAttribute("aria-colindex", String((i % 7) + 1));
		});
	});

	it("Issue C - roving tabindex: exactly one focusable day, rest -1, grid not focusable", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const days = Array.from(root.querySelectorAll<HTMLElement>(".flatpickr-day"));
		const focusable = days.filter(d => d.getAttribute("tabindex") === "0");
		expect(focusable).toHaveLength(1);
		days.filter(d => d !== focusable[0]).forEach(d =>
			expect(d).toHaveAttribute("tabindex", "-1"),
		);

		// The inner container is no longer in the tab order and carries no activedescendant
		// (focus lives on a day cell via roving tabindex).
		const innerContainer = root.querySelector(".flatpickr-innerContainer");
		expect(innerContainer).not.toHaveAttribute("tabindex");
		expect(innerContainer).not.toHaveAttribute("aria-activedescendant");
	});

	it("Issue D - day cells have a spoken date label (not MM/DD/YYYY)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// First in-month day announces a spoken date, e.g. "June 1, 2026".
		const firstInMonth = root.querySelector<HTMLElement>(
			".dayContainer .flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
		);
		expect(firstInMonth?.getAttribute("aria-label")).toMatch(/^[A-Za-z]+ \d{1,2}, \d{4}$/);
	});

	it("Issue E - arrow keys move roving focus one day at a time (single step)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const start = activeDay(root)!;
		start.focus();
		const startTime = dateOf(start)!.getTime();

		// ArrowRight -> the very next day (exactly one step), with real DOM focus.
		pressKey("ArrowRight");
		const afterRight = document.activeElement as HTMLElement;
		expect(afterRight).not.toBe(start);
		expect(afterRight.classList.contains("flatpickr-day")).toBe(true);
		expect(dateOf(afterRight)!.getTime() - startTime).toBe(86_400_000); // +1 day
		expect(root.querySelectorAll('.flatpickr-day[tabindex="0"]')).toHaveLength(1);
		expect(activeDay(root)).toBe(afterRight); // roving tabindex follows DOM focus

		// ArrowLeft -> back to the start day.
		pressKey("ArrowLeft");
		expect(dateOf(document.activeElement)!.getTime()).toBe(startTime);

		// ArrowDown -> +1 week, ArrowUp -> back.
		pressKey("ArrowDown");
		expect(dateOf(document.activeElement)!.getTime() - startTime).toBe(7 * 86_400_000);
		pressKey("ArrowUp");
		expect(dateOf(document.activeElement)!.getTime()).toBe(startTime);
		expect(root.querySelectorAll('.flatpickr-day[tabindex="0"]')).toHaveLength(1);

		// The focused cell still ends up announcing its date (aria-label restored after toggle).
		await waitFor(() => expect(focusedLabel()).toMatch(/^[A-Za-z]+ \d{1,2}, \d{4}$/));
	});

	it("Issue E - Home/End move within the focused week", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();

		pressKey("End"); // last day (col 6) of the week
		const endCol = getDayCells(root).indexOf(document.activeElement as HTMLElement) % 7;
		expect(endCol).toBe(6);

		pressKey("Home"); // first day (col 0) of the week
		const homeCol = getDayCells(root).indexOf(document.activeElement as HTMLElement) % 7;
		expect(homeCol).toBe(0);

		expect(root.querySelectorAll('.flatpickr-day[tabindex="0"]')).toHaveLength(1);
	});

	it("Issue E - PageDown changes month keeping the same day; grid stays navigable", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();
		const before = dateOf(document.activeElement)!;

		pressKey("PageDown");
		const after = dateOf(document.activeElement)!;
		expect((document.activeElement as HTMLElement).classList.contains("flatpickr-day")).toBe(true);
		expect(after.getDate()).toBe(before.getDate()); // same day-of-month
		// Month advanced by one (wrapping year at December).
		expect((after.getFullYear() - before.getFullYear()) * 12 + (after.getMonth() - before.getMonth())).toBe(1);
		expect(root.querySelectorAll('.flatpickr-day[tabindex="0"]')).toHaveLength(1);

		// Still navigable after the month change.
		pressKey("ArrowRight");
		expect(document.activeElement).toBe(activeDay(root));
	});

	it("Issue E - Shift+PageUp/PageDown change the year, keeping the same day", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();
		const before = dateOf(document.activeElement)!;

		pressKey("PageDown", true); // Shift+PageDown -> next year
		const next = dateOf(document.activeElement)!;
		expect(next.getFullYear()).toBe(before.getFullYear() + 1);
		expect(next.getDate()).toBe(before.getDate());

		pressKey("PageUp", true); // Shift+PageUp -> back a year
		const back = dateOf(document.activeElement)!;
		expect(back.getFullYear()).toBe(before.getFullYear());
		expect(back.getDate()).toBe(before.getDate());
	});

	it("Issue E - arrow off the grid edge moves to the sequential adjacent-month day", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// Last visible cell is a next-month overflow day; ArrowRight should land on the NEXT
		// calendar day (sequential), not flatpickr's "first available day of the new month".
		const last = getDayCells(root).at(-1)!;
		const lastTime = dateOf(last)!.getTime();
		last.setAttribute("tabindex", "0");
		last.focus();

		pressKey("ArrowRight");
		await waitFor(() =>
			expect((document.activeElement as HTMLElement).classList.contains("flatpickr-day")).toBe(true),
		);
		expect(dateOf(document.activeElement)!.getTime() - lastTime).toBe(86_400_000); // +1 day

		// First visible cell is a prev-month overflow day; ArrowLeft -> previous calendar day.
		const first = getDayCells(root)[0];
		const firstTime = dateOf(first)!.getTime();
		first.setAttribute("tabindex", "0");
		first.focus();

		pressKey("ArrowLeft");
		await waitFor(() =>
			expect((document.activeElement as HTMLElement).classList.contains("flatpickr-day")).toBe(true),
		);
		expect(firstTime - dateOf(document.activeElement)!.getTime()).toBe(86_400_000); // -1 day
	});

	it("Issue E - Enter selects the focused day and keeps roving focus valid", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();
		pressKey("ArrowRight");
		// fireEvent so React's onChange state update (enabling submit) flushes inside act();
		// keyCode set so the event reaches the handler as a browser delivers it.
		fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter", keyCode: 13 });

		// Selection happened (submit button is now enabled).
		expect(getByTestId("button-submit")).toBeEnabled();

		// Selected gridcell is marked, and exactly one day remains focusable.
		const selected = root.querySelector<HTMLElement>(".flatpickr-day.selected");
		expect(selected).toHaveAttribute("aria-selected", "true");
		await waitFor(() => expect(selected).toHaveAttribute("tabindex", "0"));
		expect(root.querySelectorAll('.flatpickr-day[tabindex="0"]')).toHaveLength(1);
	});

	it("Issue F - opening the dialog moves focus to its (focusable) heading", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		await openDialog(findByRole, getByTestId);

		const dialog = await findByRole("dialog");
		const headingId = dialog.getAttribute("aria-labelledby");
		const heading = headingId ? document.getElementById(headingId) : null;
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveAttribute("tabindex", "-1");
		expect(document.activeElement).toBe(heading);
	});

	it("Issue G - Shift+Tab from a day is not hijacked to flatpickr's hidden input", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();
		// flatpickr's own keydown would send Shift+Tab to its hidden input (a dead end); our
		// handler stops that. jsdom does not perform native tab movement, so assert the negative:
		// focus did NOT jump to the hidden input.
		pressKey("Tab", true);
		expect((document.activeElement as HTMLElement).classList.contains("flatpickr-input")).toBe(false);
	});

	it("Issue H - re-entering the grid re-announces the date (cell aria-label toggle)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const day = activeDay(root)!;
		const dateLabel = day.getAttribute("aria-label");
		const nextBtn = root.querySelector(".flatpickr-next-month") as HTMLElement;

		// Capture the aria-label transitions so we can prove NVDA sees a fresh name on entry.
		const transitions: (string | null)[] = [];
		const observer = new MutationObserver(records =>
			records.forEach(r => {
				if (r.attributeName === "aria-label") {
					transitions.push((r.target as HTMLElement).getAttribute("aria-label"));
				}
			}),
		);
		observer.observe(day, { attributes: true, attributeFilter: ["aria-label"] });

		// Simulate focus arriving into the grid from outside (e.g. tabbing from the next-month
		// button). The cell's name is toggled blank -> restored so NVDA re-reads it.
		day.dispatchEvent(new FocusEvent("focusin", { bubbles: true, relatedTarget: nextBtn }));
		await waitFor(() => expect(transitions).toEqual(["", dateLabel]));
		observer.disconnect();

		expect(day.getAttribute("aria-label")).toBe(dateLabel);
	});

	it("Issue H - focusing a day does NOT also write the date to the live region (no double announce)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const liveRegion = root.querySelector("[aria-live]") as HTMLElement;
		const day = activeDay(root)!;
		const dateLabel = day.getAttribute("aria-label") || "__none__";

		const liveWrites: (string | null)[] = [];
		const observer = new MutationObserver(() => liveWrites.push(liveRegion.textContent));
		observer.observe(liveRegion, { childList: true, characterData: true, subtree: true });

		day.dispatchEvent(
			new FocusEvent("focusin", {
				bubbles: true,
				relatedTarget: root.querySelector(".flatpickr-next-month"),
			}),
		);
		await flush();
		observer.disconnect();

		// The date is announced via the cell-name toggle only; the live region must not repeat it.
		expect(liveWrites).not.toContain(dateLabel);
	});
});
