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
		expect(screen.getAllByRole("button")).toHaveLength(2);
		expect(screen.getAllByRole("link")).toHaveLength(2);
	});

	it("does not use aria-label on buttons", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const allInteractive = [
			...screen.getAllByRole("button"),
			...screen.getAllByRole("link"),
		];

		allInteractive.forEach(el => {
			expect(el).not.toHaveAttribute("aria-label");
		});
	});

	it("renders sr-only position text inside buttons when multiple buttons exist", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const allInteractive = [
			...screen.getAllByRole("button"),
			...screen.getAllByRole("link"),
		];

		allInteractive.forEach(el => {
			const srOnlySpan = el.querySelector("span");
			expect(srOnlySpan?.textContent).toMatch(/\d+ of 4:/);
		});
	});

	it("renders phone number button as anchor element with 'href' attribute", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const links = screen.getAllByRole("link");
		const phoneLink = links.find(link => link.getAttribute("href")?.startsWith("tel:"));
		expect(phoneLink).toBeInTheDocument();
		expect(phoneLink).toHaveAttribute("href", "tel:000111222");
		expect(phoneLink).not.toHaveAttribute("aria-label");
	});

	it("includes 'Opens in new tab' sr-only text for web_url buttons", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const links = screen.getAllByRole("link");
		const webUrlLink = links.find(link => link.textContent?.includes("Opens in new tab"));
		expect(webUrlLink).toBeInTheDocument();
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
											title: '<span lang="es">jalapeño</span> recipe',
											url: "https://example.com/recipe",
										},
									],
								},
							},
						},
					},
				},
			},
		} as unknown as IMessage;

		it("renders HTML lang attributes in the DOM for screen readers", async () => {
			await waitFor(() => {
				render(<Message message={langMessage} />);
			});

			const postbackButton = screen.getAllByRole("button")[0];
			expect(postbackButton.querySelector("span[lang='fr']")).toBeInTheDocument();
			expect(postbackButton.querySelector("span[lang='fr']")?.textContent).toBe("Bonjour");
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
				expect(el).not.toHaveAttribute("aria-label");
			});
		});
	});
});
