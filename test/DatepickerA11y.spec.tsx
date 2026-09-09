import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import singleDate from "test/fixtures/datepicker/singleDate.json";
import multipleDates from "test/fixtures/datepicker/multiple.json";
import rangeDates from "test/fixtures/datepicker/range.json";
import weekNumbers from "test/fixtures/datepicker/weekNumbers.json";
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

// Dispatch a keydown carrying a real keyCode. Flatpickr's native arrow navigation reads
// e.keyCode, so arrow tests must set it (Testing Library's keyDown leaves keyCode at 0).
const KEY_CODES: Record<string, number> = {
	Tab: 9,
	Enter: 13,
	" ": 32,
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

// Spoken day label: "<Weekday>, <Month> <D>, <YYYY>", optionally followed by ", start of range" /
// ", end of range" in range mode (CGY-30560). Selected/today are states, not words in the name.
const DATE_LABEL = /^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}(, |$)/;
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
		expect(today.getAttribute("aria-label")).toMatch(/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/);

		// No day carries state words in its name outside range mode.
		getInMonthCells(root).forEach(cell => {
			expect(cell.getAttribute("aria-label")).not.toMatch(/today|selected|range/i);
		});
		expect(root.querySelector(".dayContainer .flatpickr-day.today")).not.toHaveAttribute(
			"aria-selected",
		);
	});

	it("multiple mode: each selected day is aria-selected; the state is not repeated in the name", async () => {
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
			// Name = weekday + date only; "selected" is conveyed by aria-selected (APG).
			expect(cell.getAttribute("aria-label")).toMatch(
				/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/,
			);
		});

		// Day 2, between them, is not selected.
		const between = getInMonthCells(root)[1];
		expect(between).not.toHaveAttribute("aria-selected");
	});

	it("range mode: endpoints announce start/end of range; days between are selected", async () => {
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
		expect(start.getAttribute("aria-label")).toMatch(
			/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}, start of range$/,
		);
		expect(end).toHaveAttribute("aria-selected", "true");
		expect(end.getAttribute("aria-label")).toMatch(
			/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}, end of range$/,
		);
		expect(ymd(dateOf(end)!)).toBe(ymd(addDays(dateOf(start)!, 3)));

		// Inner range days (2 and 3) are selected too, without a boundary word.
		const inner = root.querySelectorAll<HTMLElement>(".dayContainer .flatpickr-day.inRange");
		expect(inner.length).toBeGreaterThanOrEqual(2);
		inner.forEach(cell => {
			expect(cell).toHaveAttribute("aria-selected", "true");
			expect(cell.getAttribute("aria-label")).toMatch(
				/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/,
			);
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
		expect(root.querySelector(".flatpickr-rContainer")).not.toHaveAttribute("role");

		// "Wk" header is column 1 of the header row, claimed via aria-owns, spoken as "Week".
		const weekHeader = root.querySelector<HTMLElement>(
			".flatpickr-weekwrapper .flatpickr-weekday",
		)!;
		expect(weekHeader).toHaveAttribute("role", "columnheader");
		expect(weekHeader).toHaveAttribute("aria-colindex", "1");
		expect(weekHeader).toHaveAttribute("aria-label", "Week");
		expect(weekHeader).toHaveAttribute("abbr", "Wk");
		expect(weekHeader.id).not.toBe("");
		expect(root.querySelector(".flatpickr-weekdays")).toHaveAttribute(
			"aria-owns",
			weekHeader.id,
		);

		// Weekday headers shift to columns 2-8.
		const weekdays = root.querySelectorAll(".flatpickr-weekdaycontainer .flatpickr-weekday");
		expect(weekdays).toHaveLength(7);
		weekdays.forEach((weekday, i) => {
			expect(weekday).toHaveAttribute("role", "columnheader");
			expect(weekday).toHaveAttribute("aria-colindex", String(i + 2));
		});

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

describe("CGY-30559 - AM/PM toggle", () => {
	const messageSingleDate = singleDate as unknown as IMessage;

	it("is a keyboard-operable button: Enter and Space toggle the value and keep focus on it", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const amPm = root.querySelector<HTMLElement>(".flatpickr-am-pm")!;
		expect(amPm).toHaveAttribute("role", "button");
		expect(amPm).toHaveAttribute("tabindex", "0");
		const initial = amPmValue(amPm);
		expect(["AM", "PM"]).toContain(initial);
		const other = initial === "AM" ? "PM" : "AM";

		amPm.focus();
		fireEvent.keyDown(amPm, { key: "Enter", keyCode: 13 });
		expect(amPmValue(amPm)).toBe(other);
		// flatpickr's own Enter handler would have moved focus to its hidden input; ours keeps it.
		expect(document.activeElement).toBe(amPm);

		fireEvent.keyDown(amPm, { key: " ", keyCode: 32 });
		expect(amPmValue(amPm)).toBe(initial);
		expect(document.activeElement).toBe(amPm);
		// The dialog is still open (Enter did not trigger flatpickr's close path).
		expect(root.querySelector('[role="dialog"]')).toBeInTheDocument();
	});

	it("announces the new value through the live region after activation", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const amPm = root.querySelector<HTMLElement>(".flatpickr-am-pm")!;
		const liveRegion = root.querySelector("[aria-live]") as HTMLElement;
		const initial = amPmValue(amPm);
		const other = initial === "AM" ? "PM" : "AM";

		amPm.focus();
		fireEvent.keyDown(amPm, { key: "Enter", keyCode: 13 });
		await waitFor(() => expect(liveRegion.textContent).toBe(other));

		// flatpickr's native ArrowUp toggle is announced too.
		fireEvent.keyDown(amPm, { key: "ArrowUp", keyCode: 38 });
		await waitFor(() => expect(liveRegion.textContent).toBe(initial));
	});

	it("selecting a day does not announce AM/PM (programmatic re-apply of the same value)", async () => {
		const { getByTestId, findByRole } = render(<Message message={messageSingleDate} />);
		const root = await openDialog(findByRole, getByTestId);

		const liveRegion = root.querySelector("[aria-live]") as HTMLElement;
		const liveWrites: (string | null)[] = [];
		const observer = new MutationObserver(() => liveWrites.push(liveRegion.textContent));
		observer.observe(liveRegion, { childList: true, characterData: true, subtree: true });

		activeDay(root)!.focus();
		pressKey("ArrowRight");
		await selectFocusedDayAndSettle();
		await flush();
		observer.disconnect();

		expect(liveWrites).not.toContain("AM");
		expect(liveWrites).not.toContain("PM");
	});
});
