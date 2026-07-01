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

	it("uses aria-labelledby for accessible names with position text", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const allButtons = screen.getAllByLabelText(/(1|2|3|4) of 4: foobar005b(1|2|3|4)/);
		expect(allButtons).toHaveLength(4);

		// Each button should use aria-labelledby, not aria-label
		allButtons.forEach(button => {
			expect(button).toHaveAttribute("aria-labelledby");
			expect(button).not.toHaveAttribute("aria-label");
		});
	});

	it("renders sr-only position spans with correct IDs", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const allButtons = screen.getAllByLabelText(/(1|2|3|4) of 4: foobar005b(1|2|3|4)/);
		allButtons.forEach(button => {
			const labelledBy = button.getAttribute("aria-labelledby")!;
			const ids = labelledBy.split(" ");

			// Position ID should reference a sr-only span inside the button
			const posId = ids[0];
			const posSpan = button.querySelector(`#${posId}`);
			expect(posSpan).toBeInTheDocument();
			expect(posSpan?.textContent).toMatch(/\d+ of 4:/);
		});
	});

	it("renders Typography label with id referenced by aria-labelledby", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const allButtons = screen.getAllByLabelText(/(1|2|3|4) of 4: foobar005b(1|2|3|4)/);
		allButtons.forEach(button => {
			const labelledBy = button.getAttribute("aria-labelledby")!;
			const ids = labelledBy.split(" ");

			// Title ID (second in list) should reference the visible Typography span
			const titleId = ids[1];
			const titleEl = button.querySelector(`#${titleId}`);
			expect(titleEl).toBeInTheDocument();
			expect(titleEl?.tagName.toLowerCase()).toBe("span");
		});
	});

	it("renders phone number button as anchor element with 'href' attribute", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const phoneButton = screen.getByLabelText(/4 of 4: foobar005b4/);
		expect(phoneButton).toHaveAttribute("href", "tel:000111222");
		expect(phoneButton).toHaveAttribute("aria-labelledby");
		expect(phoneButton).not.toHaveAttribute("aria-label");
	});

	it("includes 'Opens in new tab' sr-only span for web_url buttons", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		// The web_url button (foobar005b2) without target="_self" should have new tab announcement
		const webUrlButton = screen.getByLabelText(/2 of 4:.*foobar005b2.*Opens in new tab/);
		expect(webUrlButton).toBeInTheDocument();

		const labelledBy = webUrlButton.getAttribute("aria-labelledby")!;
		const ids = labelledBy.split(" ");
		// Should have 3 IDs: position, title, new-tab
		expect(ids).toHaveLength(3);

		const newTabId = ids[2];
		const newTabSpan = webUrlButton.querySelector(`#${newTabId}`);
		expect(newTabSpan).toBeInTheDocument();
		expect(newTabSpan?.textContent).toBe("Opens in new tab");
	});

	describe("buttons with HTML lang attributes in titles", () => {
		const langMessage = {
			text: null,
			data: {
				_cognigy: {
					_webchat: {
						message: {
							attachment: {
								type: "template",
								payload: {
									text: "Multilingual",
									template_type: "button",
									buttons: [
										{
											type: "postback",
											payload: "greet_fr",
											title: '<span lang="fr">Bonjour</span> – French',
										},
										{
											type: "web_url",
											title: '<span lang="ja">東京</span> guide',
											url: "https://example.com/tokyo",
										},
									],
								},
							},
						},
					},
				},
			},
		} as unknown as IMessage;

		it("renders HTML lang attributes in the Typography label element", async () => {
			await waitFor(() => {
				render(<Message message={langMessage} />);
			});

			const buttons = screen.getAllByRole("button");
			const postbackButton = buttons[0];
			const labelledBy = postbackButton.getAttribute("aria-labelledby")!;
			const titleId = labelledBy.split(" ")[1];
			const titleEl = postbackButton.querySelector(`#${titleId}`);

			// The Typography span should contain the lang-attributed HTML
			expect(titleEl?.querySelector("span[lang='fr']")).toBeInTheDocument();
			expect(titleEl?.querySelector("span[lang='fr']")?.textContent).toBe("Bonjour");
		});

		it("does not put raw HTML in aria-label", async () => {
			await waitFor(() => {
				render(<Message message={langMessage} />);
			});

			const allInteractive = [
				...screen.getAllByRole("button"),
				...screen.getAllByRole("link"),
			];

			allInteractive.forEach(el => {
				const ariaLabel = el.getAttribute("aria-label");
				if (ariaLabel) {
					expect(ariaLabel).not.toContain("<span");
					expect(ariaLabel).not.toContain("lang=");
				}
			});
		});
	});
});
