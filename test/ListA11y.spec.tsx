/**
 * List template interaction A11y spec.
 *
 * List.spec.tsx covers the list/listitem structure and decorative-image
 * handling; the axe sweep covers static ARIA. This spec covers what neither
 * can: rows with a default_action behaving as keyboard-operable links
 * (role, name with new-tab announcement, tabindex, Enter activation with
 * URL sanitization) and rows without one staying out of the tab order.
 */
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Message from "src/messages/Message";
import { asBot } from "./fixtures/message-cases";
import listFixture from "./fixtures/list.json";
import { getTabbables } from "./a11y-utils";
import type { IMessage } from "@cognigy/socket-client";

// Explicit role="link" rows (the header + rows carrying a default_action).
// Anchors rendered by action buttons have implicit link roles but no role
// attribute, so this selector isolates the clickable rows.
const clickableRows = (root: ParentNode) =>
	Array.from(root.querySelectorAll<HTMLElement>('[role="link"]'));

const listItemMessage = (element: object): IMessage =>
	asBot({
		data: {
			_cognigy: {
				_webchat: {
					message: {
						attachment: {
							type: "template",
							payload: { template_type: "list", elements: [element, element] },
						},
					},
				},
			},
		},
	});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("List Accessibility (clickable rows)", () => {
	it("rows with a default_action are named links in the tab order", () => {
		const { container } = render(<Message message={asBot(listFixture)} />);

		// list.json: header element + 3 of 4 list elements carry a default_action.
		const rows = clickableRows(container);
		expect(rows).toHaveLength(4);
		rows.forEach(row => {
			expect(row).toHaveAttribute("tabindex", "0");
			expect(row.getAttribute("aria-label")).toContain("Opens in new tab");
		});

		const tabbables = getTabbables(container);
		rows.forEach(row => expect(tabbables).toContain(row));
	});

	it("a clickable row's subtitle is exposed as its accessible description", () => {
		const { container } = render(<Message message={asBot(listFixture)} />);

		const header = clickableRows(container)[0];
		const subtitleId = header.getAttribute("aria-describedby");
		expect(subtitleId).toBeTruthy();
		expect(document.getElementById(subtitleId as string)).toHaveTextContent(
			"Find out more about its features",
		);
	});

	it("rows without a default_action expose no link semantics and stay out of the tab order", () => {
		const { container } = render(<Message message={asBot(listFixture)} />);

		// list.json element 2 ("foobar009l2" without default_action).
		const plainRows = Array.from(
			container.querySelectorAll<HTMLElement>(".webchat-list-template-element:not([role])"),
		);
		expect(plainRows.length).toBeGreaterThan(0);
		plainRows.forEach(row => {
			expect(row).toHaveAttribute("tabindex", "-1");
			expect(row).not.toHaveAttribute("aria-label");
		});
	});

	it("Enter on a clickable row opens its URL", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		const { container } = render(<Message message={asBot(listFixture)} />);

		const header = clickableRows(container)[0];
		header.focus();
		fireEvent.keyDown(header, { key: "Enter", code: "Enter", keyCode: 13 });

		// sanitizeUrl normalizes safe URLs (trailing slash) — the call goes
		// through the sanitized value.
		expect(openSpy).toHaveBeenCalledWith("https://example.com/");
	});

	it("Enter on a row with a dangerous default_action URL does not navigate", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		const { container } = render(
			<Message
				message={listItemMessage({
					title: "Bad link",
					default_action: { type: "web_url", url: "javascript:alert(1)" },
				})}
			/>,
		);

		const row = clickableRows(container)[0];
		fireEvent.keyDown(row, { key: "Enter", code: "Enter", keyCode: 13 });

		expect(openSpy).not.toHaveBeenCalled();
	});
});
