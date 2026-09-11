import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import singleDate from "test/fixtures/datepicker/singleDate.json";
import multipleDates from "test/fixtures/datepicker/multiple.json";
import rangeDates from "test/fixtures/datepicker/range.json";
import weekNumbers from "test/fixtures/datepicker/weekNumbers.json";
import localeDe from "test/fixtures/datepicker/localeDe.json";
import { IMessage } from "@cognigy/socket-client";
import { pressKey, expectSingleTabStop } from "./a11y-utils";

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
const dateOf = (cell: Element | null) => (cell as unknown as { dateObj?: Date } | null)?.dateObj;

// Compare two dates by calendar date (year/month/day) only. Asserting raw getTime() deltas of
// 86,400,000ms is DST-flaky: a midnight-to-midnight "day" is 23h or 25h across a DST transition.
const ymd = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
// The calendar date N days after `from`, using local-date arithmetic (DST-safe, unlike ±86.4e6 ms).
const addDays = (from: Date, days: number) => {
	const date = new Date(from);
	date.setDate(date.getDate() + days);
	return date;
};

// Keys are dispatched with `pressKey` from test/a11y-utils.ts (real keyCode — flatpickr's native
// arrow navigation reads e.keyCode, which Testing Library leaves at 0).
const focusedLabel = () => (document.activeElement as HTMLElement)?.getAttribute("aria-label");

// Spoken day label: "<Weekday>, <Month> <D>, <YYYY>", optionally followed by ", start of range" /
// ", end of range" in range mode (CGY-30560). Selected/today are states (aria-selected,
// aria-current="date"), not words in the name.
const DATE_LABEL = /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}(, |$)/;
// A day label with no range word.
const PLAIN_DATE_LABEL = /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/;
const RANGE_START_LABEL = /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}, start of range$/;
const RANGE_END_LABEL = /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}, end of range$/;
// English long weekday for a date (the fixtures use the "en" flatpickr locale).
const weekdayOf = (date: Date) =>
	new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
// In-month day cells of the visible grid (prev/next-month overflow cells excluded).
const getInMonthCells = (root: HTMLElement) =>
	getDayCells(root).filter(
		c => !c.classList.contains("prevMonthDay") && !c.classList.contains("nextMonthDay"),
	);
// Make `cell` the roving-focus target and focus it.
const focusCell = (cell: HTMLElement) => {
	cell.setAttribute("tabindex", "0");
	cell.focus();
};
// Select the focused day with Enter (fireEvent so React's onChange state update flushes in act()).
const selectFocusedDay = () =>
	fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter", keyCode: 13 });
// Select, then wait until roving focus has landed on the just-selected day in the rebuilt grid
// and its aria-label has been restored after the focus-time name toggle (see `flush` below).
const selectFocusedDayAndSettle = async () => {
	selectFocusedDay();
	await waitFor(() => expect(focusedLabel()).toMatch(DATE_LABEL));
};
// The AM/PM toggle's value: its text nodes only (the appended arrow icons are ignored).
const amPmValue = (amPm: HTMLElement) =>
	Array.from(amPm.childNodes)
		.filter(n => n.nodeType === Node.TEXT_NODE)
		.map(n => n.textContent)
		.join("")
		.trim();

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
		// The grid's own wrapper is layout only.
		expect(root.querySelector(".flatpickr-innerContainer")).toHaveAttribute(
			"role",
			"presentation",
		);

		// Weekday headers are columnheaders (aria-colindex 1-7) within the header row; flatpickr's
		// flex wrapper between the row and its headers is presentational, so the row directly
		// owns the columnheaders (ARIA required owned elements).
		const weekdayRow = root.querySelector(".flatpickr-weekdays");
		expect(weekdayRow).toHaveAttribute("role", "row");
		expect(weekdayRow).toHaveAttribute("aria-rowindex", "1");
		expect(weekdayRow?.querySelector(".flatpickr-weekdaycontainer")).toHaveAttribute(
			"role",
			"presentation",
		);
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

		// `.flatpickr-days` is the rowgroup; the `.dayContainer` flatpickr rebuilds is layout only.
		expect(root.querySelector(".flatpickr-days")).toHaveAttribute("role", "rowgroup");
		const dayContainer = root.querySelector(".dayContainer");
		expect(dayContainer).toHaveAttribute("role", "presentation");

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

	it("Issue C - six role=row elements claim the cells via aria-owns (row level without DOM moves)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// The row level lives in visually-hidden row elements appended after `.dayContainer`
		// (flatpickr indexes `.flatpickr-days.children[0]`), each owning its 7 cells by id, so the
		// accessibility tree is grid > rowgroup > row > gridcell while the DOM stays flat.
		const daysContainer = root.querySelector(".flatpickr-days")!;
		expect(daysContainer.firstElementChild).toHaveClass("dayContainer");
		const rows = Array.from(
			daysContainer.querySelectorAll<HTMLElement>(':scope > [role="row"]'),
		);
		expect(rows).toHaveLength(6);
		const days = getDayCells(root);
		rows.forEach((row, r) => {
			expect(row).toHaveAttribute("aria-rowindex", String(r + 2));
			const owned = row.getAttribute("aria-owns")!.split(" ");
			expect(owned).toEqual(days.slice(r * 7, r * 7 + 7).map(d => d.id));
			owned.forEach(id =>
				expect(document.getElementById(id)).toHaveAttribute("role", "gridcell"),
			);
			// Visually hidden, never display:none (that would drop the row from the a11y tree).
			expect(row.style.display).not.toBe("none");
		});
		// Every cell is owned by exactly one row.
		expect(new Set(rows.flatMap(r => r.getAttribute("aria-owns")!.split(" "))).size).toBe(42);

		// Rows are rebuilt with the grid on a month change and still own the new cells.
		fireEvent.click(root.querySelector(".flatpickr-next-month") as Element);
		await waitFor(() => {
			const rowsAfter = daysContainer.querySelectorAll(':scope > [role="row"]');
			expect(rowsAfter).toHaveLength(6);
			const daysAfter = getDayCells(root);
			rowsAfter.forEach((row, r) =>
				expect(row.getAttribute("aria-owns")!.split(" ")).toEqual(
					daysAfter.slice(r * 7, r * 7 + 7).map(d => d.id),
				),
			);
		});
	});

	it("Issue C - roving tabindex: exactly one focusable day, rest -1, grid not focusable", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		expectSingleTabStop(root, ".flatpickr-day");
		const days = Array.from(root.querySelectorAll<HTMLElement>(".flatpickr-day"));
		days.filter(d => d.getAttribute("tabindex") !== "0").forEach(d =>
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

		// First in-month day announces a spoken date, e.g. "Monday, June 1, 2026".
		const firstInMonth = getInMonthCells(root)[0];
		expect(firstInMonth.getAttribute("aria-label")).toMatch(DATE_LABEL);
	});

	it("Issue E - arrow keys move roving focus one day at a time (single step)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const start = activeDay(root)!;
		start.focus();
		const startDate = dateOf(start)!;

		// ArrowRight -> the very next day (exactly one step), with real DOM focus.
		pressKey("ArrowRight");
		const afterRight = document.activeElement as HTMLElement;
		expect(afterRight).not.toBe(start);
		expect(afterRight.classList.contains("flatpickr-day")).toBe(true);
		expect(ymd(dateOf(afterRight)!)).toBe(ymd(addDays(startDate, 1))); // +1 calendar day
		expect(root.querySelectorAll('.flatpickr-day[tabindex="0"]')).toHaveLength(1);
		expect(activeDay(root)).toBe(afterRight); // roving tabindex follows DOM focus

		// ArrowLeft -> back to the start day.
		pressKey("ArrowLeft");
		expect(ymd(dateOf(document.activeElement)!)).toBe(ymd(startDate));

		// ArrowDown -> +1 week, ArrowUp -> back.
		pressKey("ArrowDown");
		expect(ymd(dateOf(document.activeElement)!)).toBe(ymd(addDays(startDate, 7)));
		pressKey("ArrowUp");
		expect(ymd(dateOf(document.activeElement)!)).toBe(ymd(startDate));
		expect(root.querySelectorAll('.flatpickr-day[tabindex="0"]')).toHaveLength(1);

		// The focused cell still ends up announcing its date (aria-label restored after toggle).
		await waitFor(() => expect(focusedLabel()).toMatch(DATE_LABEL));
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
		expect((document.activeElement as HTMLElement).classList.contains("flatpickr-day")).toBe(
			true,
		);
		// Same day-of-month, except flatpickr clamps to the last day when the
		// next month is shorter (e.g. PageDown from Aug 31 lands on Sep 30 —
		// asserting the raw day made this test fail on month-end run dates).
		const daysInNextMonth = new Date(before.getFullYear(), before.getMonth() + 2, 0).getDate();
		expect(after.getDate()).toBe(Math.min(before.getDate(), daysInNextMonth));
		// Month advanced by one (wrapping year at December).
		expect(
			(after.getFullYear() - before.getFullYear()) * 12 +
				(after.getMonth() - before.getMonth()),
		).toBe(1);
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
		// Same clamp caveat as PageDown above: Feb 29 lands on Feb 28 in a
		// non-leap year.
		const daysInMonthNextYear = new Date(
			before.getFullYear() + 1,
			before.getMonth() + 1,
			0,
		).getDate();
		expect(next.getDate()).toBe(Math.min(before.getDate(), daysInMonthNextYear));

		pressKey("PageUp", true); // Shift+PageUp -> back a year
		const back = dateOf(document.activeElement)!;
		expect(back.getFullYear()).toBe(before.getFullYear());
		// The clamped day always exists in the original month, so going back
		// preserves it (Feb 29 → Feb 28 → Feb 28, not back to 29).
		expect(back.getDate()).toBe(next.getDate());
	});

	it("Issue E - arrow off the grid edge moves to the sequential adjacent-month day", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// Last visible cell is a next-month overflow day; ArrowRight should land on the NEXT
		// calendar day (sequential), not flatpickr's "first available day of the new month".
		const last = getDayCells(root).at(-1)!;
		const lastDate = dateOf(last)!;
		last.setAttribute("tabindex", "0");
		last.focus();

		pressKey("ArrowRight");
		await waitFor(() =>
			expect(
				(document.activeElement as HTMLElement).classList.contains("flatpickr-day"),
			).toBe(true),
		);
		expect(ymd(dateOf(document.activeElement)!)).toBe(ymd(addDays(lastDate, 1))); // +1 calendar day

		// First visible cell is a prev-month overflow day; ArrowLeft -> previous calendar day.
		const first = getDayCells(root)[0];
		const firstDate = dateOf(first)!;
		first.setAttribute("tabindex", "0");
		first.focus();

		pressKey("ArrowLeft");
		await waitFor(() =>
			expect(
				(document.activeElement as HTMLElement).classList.contains("flatpickr-day"),
			).toBe(true),
		);
		expect(ymd(dateOf(document.activeElement)!)).toBe(ymd(addDays(firstDate, -1))); // -1 calendar day
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
		expectSingleTabStop(root, ".flatpickr-day");
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

		// flatpickr's readonly value input (display:none in the widget) borrows the same heading
		// as its accessible name, so the axe `label` rule passes without a translation key.
		expect(dialog.querySelector(".flatpickr-input")).toHaveAttribute(
			"aria-labelledby",
			headingId,
		);
	});

	it("Issue G - Shift+Tab from a day is not hijacked to flatpickr's hidden input", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		activeDay(root)!.focus();
		// flatpickr's own keydown would send Shift+Tab to its hidden input (a dead end); our
		// handler stops that. jsdom does not perform native tab movement, so assert the negative:
		// focus did NOT jump to the hidden input.
		pressKey("Tab", true);
		expect((document.activeElement as HTMLElement).classList.contains("flatpickr-input")).toBe(
			false,
		);
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

describe("CGY-30560 - day cells expose weekday, today, selected and range state", () => {
	const messageSingleDate = singleDate as unknown as IMessage;
	const messageMultiple = multipleDates as unknown as IMessage;
	const messageRange = rangeDates as unknown as IMessage;

	it("every day label starts with its weekday; today is exposed via aria-current, not in the name", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		getInMonthCells(root).forEach(cell => {
			const label = cell.getAttribute("aria-label") || "";
			expect(label).toMatch(DATE_LABEL);
			expect(label.startsWith(`${weekdayOf(dateOf(cell)!)}, `)).toBe(true);
		});

		// The calendar opens on the current month, so today is always in view. Today is a STATE
		// (aria-current, as in the APG example) — the name must not repeat it, or screen readers
		// that speak aria-current would announce it twice.
		const today = root.querySelector<HTMLElement>(".dayContainer .flatpickr-day.today")!;
		expect(today).toHaveAttribute("aria-current", "date");
		expect(today.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);

		// Nothing is selected yet (no default date): no day carries state words in its name.
		getInMonthCells(root).forEach(cell => {
			expect(cell.getAttribute("aria-label")).not.toMatch(/today|selected|range/i);
			expect(cell).not.toHaveAttribute("aria-selected");
		});
	});

	it("single mode: the selected day is aria-selected (state only, not in the name); moving the selection moves it", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		focusCell(getInMonthCells(root)[0]);
		await selectFocusedDayAndSettle();
		const first = getInMonthCells(root)[0];
		// Selection is a STATE (APG datepicker example). Known: NVDA does not speak it on focus
		// when the focused cell is the only selected cell of the table (nvaccess/nvda#8879), so
		// this is silent in NVDA in single mode; JAWS/VoiceOver speak it.
		expect(first).toHaveAttribute("aria-selected", "true");
		expect(first.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
		expect(focusedLabel()).toMatch(PLAIN_DATE_LABEL);

		// Select the next day: the old selection loses the state.
		pressKey("ArrowRight");
		await selectFocusedDayAndSettle();
		const second = getInMonthCells(root)[1];
		expect(second).toHaveAttribute("aria-selected", "true");
		expect(second.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
		expect(getInMonthCells(root)[0]).not.toHaveAttribute("aria-selected");
		expect(getInMonthCells(root)[0].getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
		expect(
			root.querySelectorAll('.dayContainer .flatpickr-day[aria-selected="true"]'),
		).toHaveLength(1);
	});

	it("multiple mode: each selected day is aria-selected (not in the name); deselecting clears it", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageMultiple} />);
		const root = await openDialog(findByRole, getByTestId);

		// Select day 1, then day 3 of the month (ArrowRight twice from the refocused day 1).
		focusCell(getInMonthCells(root)[0]);
		await selectFocusedDayAndSettle();
		pressKey("ArrowRight");
		pressKey("ArrowRight");
		await selectFocusedDayAndSettle();

		const selected = root.querySelectorAll<HTMLElement>(
			".dayContainer .flatpickr-day.selected",
		);
		expect(selected).toHaveLength(2);
		selected.forEach(cell => {
			expect(cell).toHaveAttribute("aria-selected", "true");
			expect(cell.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
		});

		// Day 2, between them, is not selected.
		const between = getInMonthCells(root)[1];
		expect(between).not.toHaveAttribute("aria-selected");
		expect(between.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);

		// Enter on a selected day deselects it (multiple mode toggles): the state goes.
		await selectFocusedDayAndSettle();
		const third = getInMonthCells(root)[2];
		expect(third).not.toHaveClass("selected");
		expect(third).not.toHaveAttribute("aria-selected");
		expect(third.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
	});

	it("range mode: endpoints announce start/end of range; days between are aria-selected", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageRange} />);
		const root = await openDialog(findByRole, getByTestId);

		// Range: day 1 -> day 4 of the month.
		focusCell(getInMonthCells(root)[0]);
		await selectFocusedDayAndSettle();
		pressKey("ArrowRight");
		pressKey("ArrowRight");
		pressKey("ArrowRight");
		await selectFocusedDayAndSettle();

		const start = root.querySelector<HTMLElement>(".dayContainer .flatpickr-day.startRange")!;
		const end = root.querySelector<HTMLElement>(".dayContainer .flatpickr-day.endRange")!;
		// Endpoints: aria-selected state + the boundary word in the name (ARIA has no state for
		// range endpoints). "selected" itself is not repeated in the name.
		expect(start).toHaveAttribute("aria-selected", "true");
		expect(start.getAttribute("aria-label")).toMatch(RANGE_START_LABEL);
		expect(end).toHaveAttribute("aria-selected", "true");
		expect(end.getAttribute("aria-label")).toMatch(RANGE_END_LABEL);
		expect(ymd(dateOf(end)!)).toBe(ymd(addDays(dateOf(start)!, 3)));

		// Inner range days (2 and 3) are selected too, without a boundary word.
		const inner = root.querySelectorAll<HTMLElement>(".dayContainer .flatpickr-day.inRange");
		expect(inner.length).toBeGreaterThanOrEqual(2);
		inner.forEach(cell => {
			expect(cell).toHaveAttribute("aria-selected", "true");
			expect(cell.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
		});
	});

	it("range mode: the keyboard range PREVIEW (first endpoint chosen, arrowing) is exposed like the highlight it shows", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageRange} />);
		const root = await openDialog(findByRole, getByTestId);

		// Choose the first endpoint (day 1). flatpickr strips the range classes right after this
		// selection, so the lone endpoint is a plain selected day.
		focusCell(getInMonthCells(root)[0]);
		await selectFocusedDayAndSettle();
		expect(focusedLabel()).toMatch(PLAIN_DATE_LABEL);

		// Arrow to day 4 WITHOUT committing. flatpickr previews the range on every arrow move
		// (focusOnDayElem -> onMouseOver) purely via classes — no hook fires — and the preview is
		// visually identical to a committed range, so names/states must follow the classes.
		pressKey("ArrowRight");
		pressKey("ArrowRight");
		pressKey("ArrowRight");
		const cells = getInMonthCells(root);
		expect(cells[3]).toHaveClass("endRange");
		expect(cells[3]).not.toHaveClass("selected");
		await waitFor(() => expect(cells[3].getAttribute("aria-label")).toMatch(RANGE_END_LABEL));
		expect(document.activeElement).toBe(cells[3]);
		expect(cells[3]).toHaveAttribute("aria-selected", "true");
		expect(cells[0]).toHaveAttribute("aria-selected", "true");
		expect(cells[0].getAttribute("aria-label")).toMatch(RANGE_START_LABEL);
		[cells[1], cells[2]].forEach(cell => {
			expect(cell).toHaveClass("inRange");
			expect(cell).toHaveAttribute("aria-selected", "true");
			expect(cell.getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
		});
		expect(cells[4]).not.toHaveAttribute("aria-selected");

		// Arrow back one day: day 4 leaves the preview, day 3 becomes its end.
		pressKey("ArrowLeft");
		await waitFor(() => expect(cells[2].getAttribute("aria-label")).toMatch(RANGE_END_LABEL));
		expect(cells[3]).not.toHaveAttribute("aria-selected");
		expect(cells[3].getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);

		// Committing keeps exactly what the preview announced.
		await selectFocusedDayAndSettle();
		expect(focusedLabel()).toMatch(RANGE_END_LABEL);
		expect(getInMonthCells(root)[0].getAttribute("aria-label")).toMatch(RANGE_START_LABEL);
		expect(getInMonthCells(root)[1].getAttribute("aria-label")).toMatch(PLAIN_DATE_LABEL);
	});

	it("day names follow the datepicker locale's word order (Intl), e.g. German", async () => {
		const { getByTestId, findByRole } = render(
			<Message message={localeDe as unknown as IMessage} />,
		);
		const root = await openDialog(findByRole, getByTestId);

		getInMonthCells(root).forEach(cell => {
			const expected = new Intl.DateTimeFormat("de", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			}).format(dateOf(cell)!);
			// e.g. "Donnerstag, 12. Juni 2026" — not the English "<weekday>, <month> <day>, <year>".
			expect(cell.getAttribute("aria-label")).toBe(expected);
			expect(expected).toMatch(/^[A-Za-zäöü]+, \d{1,2}\. [A-Za-zä]+ \d{4}$/);
		});
	});
});

describe("CGY-30560 - week numbers are part of the calendar grid", () => {
	const messageWeeks = weekNumbers as unknown as IMessage;

	it("the grid owns the week column: 8 columns, 'Week' header, rowheaders, shifted weekdays", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageWeeks} />);
		const root = await openDialog(findByRole, getByTestId);

		// With week numbers the grid is the innerContainer (it wraps week column + day grid).
		const grid = root.querySelector(".flatpickr-innerContainer");
		expect(grid).toHaveAttribute("role", "grid");
		expect(grid).toHaveAttribute("aria-colcount", "8");
		expect(grid).toHaveAttribute("aria-rowcount", "7");
		expect(grid?.getAttribute("aria-label")).toBe("Calendar");
		// The wrappers between the grid and its row/rowgroup/rowheaders are layout only, so the
		// grid directly owns them in the accessibility tree (ARIA required owned elements).
		expect(root.querySelector(".flatpickr-rContainer")).toHaveAttribute("role", "presentation");
		expect(root.querySelector(".flatpickr-weekwrapper")).toHaveAttribute(
			"role",
			"presentation",
		);

		// The week column header is column 1 of the header row and its FIRST child, so the row
		// reads "Week, Sun, …, Sat" (aria-owns would append it last). It is a visually hidden
		// "Week"; flatpickr's visual "Wk" cell is hidden from assistive tech instead.
		const weekdayRow = root.querySelector<HTMLElement>(".flatpickr-weekdays")!;
		expect(weekdayRow).not.toHaveAttribute("aria-owns");
		const weekHeader = weekdayRow.firstElementChild as HTMLElement;
		expect(weekHeader).toHaveAttribute("role", "columnheader");
		expect(weekHeader).toHaveAttribute("aria-colindex", "1");
		expect(weekHeader.textContent).toBe("Week");
		expect(weekHeader).toHaveAttribute("abbr", "Wk");
		expect(weekHeader.id).not.toBe("");
		expect(weekHeader).not.toHaveAttribute("aria-hidden");
		expect(weekHeader.style.display).not.toBe("none");
		const visualWk = root.querySelector<HTMLElement>(
			".flatpickr-weekwrapper .flatpickr-weekday",
		)!;
		expect(visualWk.textContent?.trim()).toBe("Wk");
		expect(visualWk).toHaveAttribute("aria-hidden", "true");
		expect(visualWk).not.toHaveAttribute("role");

		// Weekday headers shift to columns 2-8, and the header row's columnheaders appear in
		// column order in the DOM (SC 1.3.2 meaningful sequence).
		const weekdays = root.querySelectorAll(".flatpickr-weekdaycontainer .flatpickr-weekday");
		expect(weekdays).toHaveLength(7);
		weekdays.forEach((weekday, i) => {
			expect(weekday).toHaveAttribute("role", "columnheader");
			expect(weekday).toHaveAttribute("aria-colindex", String(i + 2));
		});
		expect(
			Array.from(weekdayRow.querySelectorAll('[role="columnheader"]')).map(h =>
				h.getAttribute("aria-colindex"),
			),
		).toEqual(["1", "2", "3", "4", "5", "6", "7", "8"]);

		// One rowheader per week row (rows 2-7), named "Week N"; each is the first element its
		// role="row" owns (the DOM container is layout only).
		expect(root.querySelector(".flatpickr-weeks")).toHaveAttribute("role", "presentation");
		const weekCells = root.querySelectorAll<HTMLElement>(".flatpickr-weeks .flatpickr-day");
		root.querySelectorAll('.flatpickr-days > [role="row"]').forEach((row, r) => {
			expect(row.getAttribute("aria-owns")!.split(" ")[0]).toBe(weekCells[r].id);
		});
		expect(weekCells).toHaveLength(6);
		weekCells.forEach((cell, i) => {
			expect(cell).toHaveAttribute("role", "rowheader");
			expect(cell).toHaveAttribute("aria-rowindex", String(i + 2));
			expect(cell).toHaveAttribute("aria-colindex", "1");
			expect(cell.getAttribute("aria-label")).toBe(`Week ${cell.textContent?.trim()}`);
			expect(cell.id).not.toBe("");
		});

		// Day cells sit in columns 2-8 and are described by their row's week number.
		const days = getDayCells(root);
		expect(days).toHaveLength(42);
		days.forEach((day, i) => {
			expect(day).toHaveAttribute("aria-colindex", String((i % 7) + 2));
			expect(day).toHaveAttribute("aria-describedby", weekCells[Math.floor(i / 7)].id);
		});
	});

	it("week numbers stay wired to the day cells after a month change (grid rebuild)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageWeeks} />);
		const root = await openDialog(findByRole, getByTestId);

		const firstWeekBefore = root.querySelector(".flatpickr-weeks .flatpickr-day")?.textContent;
		fireEvent.click(root.querySelector(".flatpickr-next-month") as Element);

		await waitFor(() =>
			expect(root.querySelector(".flatpickr-weeks .flatpickr-day")?.textContent).not.toBe(
				firstWeekBefore,
			),
		);
		getDayCells(root).forEach(day => {
			const header = document.getElementById(day.getAttribute("aria-describedby") || "");
			expect(header).toHaveAttribute("role", "rowheader");
			expect(header).toHaveAttribute("aria-rowindex", day.getAttribute("aria-rowindex"));
			expect(header?.getAttribute("aria-label")).toMatch(/^Week \d{1,2}$/);
		});
	});
});

describe("CGY-30559 - AM/PM control (APG spinbutton)", () => {
	const messageSingleDate = singleDate as unknown as IMessage;

	const openAmPm = async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);
		const amPm = root.querySelector<HTMLElement>(".flatpickr-am-pm")!;
		return { root, amPm };
	};
	it("is a named spinbutton whose value is the visible AM/PM text; no mouse-only title", async () => {
		const { amPm } = await openAmPm();

		expect(amPm).toHaveAttribute("role", "spinbutton");
		expect(amPm).toHaveAttribute("tabindex", "0");
		expect(amPm).toHaveAttribute("aria-label", "AM/PM");
		expect(amPm).toHaveAttribute("aria-valuemin", "0");
		expect(amPm).toHaveAttribute("aria-valuemax", "1");
		const value = amPmValue(amPm);
		expect(["AM", "PM"]).toContain(value);
		expect(amPm).toHaveAttribute("aria-valuetext", value);
		expect(amPm).toHaveAttribute("aria-valuenow", value === "AM" ? "1" : "0");
		// flatpickr's title="Click to toggle" would be read as the description of a control that
		// is keyboard-operable; it is removed.
		expect(amPm).not.toHaveAttribute("title");
	});

	it("ArrowUp -> AM (max), ArrowDown -> PM (min); Home -> min (PM), End -> max (AM) per APG; no-op at the end", async () => {
		const { amPm } = await openAmPm();
		amPm.focus();

		pressKey("ArrowUp");
		expect(amPmValue(amPm)).toBe("AM");
		expect(amPm).toHaveAttribute("aria-valuetext", "AM");
		expect(amPm).toHaveAttribute("aria-valuenow", "1");
		pressKey("ArrowUp"); // already at the top: stays AM (flatpickr's own toggle is stopped)
		expect(amPmValue(amPm)).toBe("AM");

		pressKey("ArrowDown");
		expect(amPmValue(amPm)).toBe("PM");
		expect(amPm).toHaveAttribute("aria-valuetext", "PM");
		expect(amPm).toHaveAttribute("aria-valuenow", "0");
		pressKey("ArrowDown"); // already at the bottom: stays PM
		expect(amPmValue(amPm)).toBe("PM");

		// APG spinbutton: Home = minimum value, End = maximum value — consistent with the declared
		// aria-valuemin (0 = PM) / aria-valuemax (1 = AM), not the other way round.
		pressKey("End");
		expect(amPmValue(amPm)).toBe("AM");
		expect(amPm).toHaveAttribute("aria-valuenow", "1");
		pressKey("End"); // already at the maximum
		expect(amPmValue(amPm)).toBe("AM");
		pressKey("Home");
		expect(amPmValue(amPm)).toBe("PM");
		expect(amPm).toHaveAttribute("aria-valuenow", "0");
		pressKey("Home"); // already at the minimum
		expect(amPmValue(amPm)).toBe("PM");

		expect(document.activeElement).toBe(amPm);
	});

	it("Enter and Space toggle the value and keep focus on it (dialog stays open)", async () => {
		const { root, amPm } = await openAmPm();
		const initial = amPmValue(amPm);
		const other = initial === "AM" ? "PM" : "AM";

		amPm.focus();
		pressKey("Enter");
		expect(amPmValue(amPm)).toBe(other);
		expect(amPm).toHaveAttribute("aria-valuetext", other);
		// flatpickr's own Enter handler would have moved focus to its hidden input; ours keeps it.
		expect(document.activeElement).toBe(amPm);

		pressKey(" ");
		expect(amPmValue(amPm)).toBe(initial);
		expect(document.activeElement).toBe(amPm);
		expect(root.querySelector('[role="dialog"]')).toBeInTheDocument();
	});

	it("Escape from the AM/PM control still closes the dialog and returns focus to the trigger", async () => {
		const { getByTestId, findByRole, queryByRole } = render(
			<Message message={messageSingleDate} />,
		);
		const root = await openDialog(findByRole, getByTestId);
		const amPm = root.querySelector<HTMLElement>(".flatpickr-am-pm")!;
		amPm.focus();

		// The spinbutton handler stops propagation for the keys it handles ONLY; Escape must still
		// reach the dialog's keydown (APG dialog: Esc closes, focus returns to the trigger).
		// fireEvent so React's state update flushes inside act().
		fireEvent.keyDown(amPm, { key: "Escape", keyCode: 27 });
		await waitFor(() => expect(queryByRole("dialog")).not.toBeInTheDocument());
		expect(document.activeElement).toBe(getByTestId("button-open"));
	});

	it("Tab from the AM/PM control (last time field) is routed by the dialog trap, not flatpickr", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		// Select a day so the submit button (the next focusable after the time fields) is enabled.
		activeDay(root)!.focus();
		await selectFocusedDayAndSettle();

		// flatpickr's own Tab handling for time fields calls .focus() on its readonly value input
		// (`.flatpickr-input`). In the rendered widget that input is display:none, so the call is
		// a no-op in a browser; jsdom has no layout and WOULD focus it, so emulate the browser.
		const hiddenInput = root.querySelector<HTMLInputElement>(".flatpickr-input")!;
		hiddenInput.focus = () => {};

		const amPm = root.querySelector<HTMLElement>(".flatpickr-am-pm")!;
		amPm.focus();
		// The dialog's keydown treats the AM/PM control as the last time field and moves focus to
		// the next focusable element (the submit button). jsdom does not perform native tab
		// movement, so the programmatic move IS the observable result.
		pressKey("Tab");
		expect(document.activeElement).toBe(getByTestId("button-submit"));

		// Shift+Tab from the first time field (hour) goes backwards to the previous focusable
		// (the roving day), not to flatpickr's hidden input.
		const hour = root.querySelector<HTMLElement>(".flatpickr-hour")!;
		hour.focus();
		pressKey("Tab", true);
		expect((document.activeElement as HTMLElement).classList.contains("flatpickr-input")).toBe(
			false,
		);
		expect(root.contains(document.activeElement)).toBe(true);
		expect(document.activeElement).not.toBe(hour);
	});

	it("value changes are exposed on the spinbutton only — the live region is not written (no double announce)", async () => {
		const { root, amPm } = await openAmPm();
		const liveRegion = root.querySelector("[aria-live]") as HTMLElement;
		const liveWrites: (string | null)[] = [];
		const observer = new MutationObserver(() => liveWrites.push(liveRegion.textContent));
		observer.observe(liveRegion, { childList: true, characterData: true, subtree: true });

		amPm.focus();
		pressKey("Enter");
		pressKey("ArrowDown");
		await flush();
		await flush();

		// Selecting a day re-applies the same AM/PM text programmatically: also silent.
		activeDay(root)!.focus();
		pressKey("ArrowRight");
		await selectFocusedDayAndSettle();
		await flush();
		observer.disconnect();

		expect(liveWrites).not.toContain("AM");
		expect(liveWrites).not.toContain("PM");
		expect(amPm).toHaveAttribute("aria-valuetext", amPmValue(amPm));
	});
});
