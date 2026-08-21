import { render, waitFor, screen, fireEvent, createEvent } from "@testing-library/react";
import { it, describe, expect, vi, afterEach } from "vitest";
import Message from "src/messages/Message";
import buttons from "test/fixtures/action-buttons.json";
import { IMessage } from "@cognigy/socket-client";
import { IWebchatConfig } from "src/messages/types";

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

		const allInteractive = [...screen.getAllByRole("button"), ...screen.getAllByRole("link")];

		allInteractive.forEach(el => {
			expect(el).not.toHaveAttribute("aria-label");
		});
	});

	it("renders sr-only position text inside buttons when multiple buttons exist", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		const allInteractive = [...screen.getAllByRole("button"), ...screen.getAllByRole("link")];

		allInteractive.forEach(el => {
			const srOnlySpan = el.querySelector("span");
			expect(srOnlySpan?.textContent).toMatch(/\d+ of 4: /);
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
		const webUrlLink = links.find(link => link.textContent?.includes(", Opens in new tab"));
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

describe("web_url button URL sanitization", () => {
	// Single-button message so exactly one link is rendered.
	const webUrlMessage = (url: string) =>
		({
			text: null,
			data: {
				_cognigy: {
					_webchat: {
						message: {
							attachment: {
								type: "template",
								payload: {
									text: "Links",
									template_type: "button",
									buttons: [{ type: "web_url", title: "Visit", url }],
								},
							},
						},
					},
				},
			},
		}) as unknown as IMessage;

	const sanitizeOnConfig = {
		settings: { layout: { disableUrlButtonSanitization: false } },
	} as IWebchatConfig;
	const sanitizeOffConfig = {
		settings: { layout: { disableUrlButtonSanitization: true } },
	} as IWebchatConfig;

	describe("rendered href (Fix A)", () => {
		it("renders a javascript: URL as about:blank when sanitization is on (default)", async () => {
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("javascript:alert(1)")}
						config={sanitizeOnConfig}
					/>,
				);
			});

			const link = screen.getByRole("link");
			expect(link).toHaveAttribute("href", "about:blank");
		});

		it("renders the raw javascript: URL when sanitization is disabled", async () => {
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("javascript:alert(1)")}
						config={sanitizeOffConfig}
					/>,
				);
			});

			const link = screen.getByRole("link");
			expect(link).toHaveAttribute("href", "javascript:alert(1)");
		});

		it("leaves a safe https URL unchanged when sanitization is on", async () => {
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("https://example.com/")}
						config={sanitizeOnConfig}
					/>,
				);
			});

			const link = screen.getByRole("link");
			expect(link).toHaveAttribute("href", "https://example.com/");
		});

		// Regression: sanitizeUrl normalizes safe URLs (adds a trailing slash),
		// but the rendered href must stay byte-identical to the raw URL so this
		// does not become a breaking DOM change for consumers. Only dangerous
		// URLs are rewritten (to about:blank).
		it("renders a non-normalized safe URL byte-identical when sanitization is on", async () => {
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("https://example.com")}
						config={sanitizeOnConfig}
					/>,
				);
			});

			const link = screen.getByRole("link");
			expect(link).toHaveAttribute("href", "https://example.com");
		});
	});

	describe("click behavior (Fix B)", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		const clickLinkAndGetEvent = (link: Element) => {
			const clickEvent = createEvent.click(link);
			fireEvent(link, clickEvent);
			return clickEvent;
		};

		it("prevents native navigation and does not open a javascript: URL when sanitization is on", async () => {
			const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("javascript:alert(1)")}
						action={() => {}}
						config={sanitizeOnConfig}
					/>,
				);
			});

			const clickEvent = clickLinkAndGetEvent(screen.getByRole("link"));
			expect(clickEvent.defaultPrevented).toBe(true);
			expect(openSpy).not.toHaveBeenCalled();
		});

		it("prevents native navigation and opens a safe URL via window.open when sanitization is on", async () => {
			const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("https://example.com/")}
						action={() => {}}
						config={sanitizeOnConfig}
					/>,
				);
			});

			const clickEvent = clickLinkAndGetEvent(screen.getByRole("link"));
			expect(clickEvent.defaultPrevented).toBe(true);
			expect(openSpy).toHaveBeenCalledWith("https://example.com/", "_blank", "noopener");
		});

		it("passes the raw URL through window.open (opt-out) when sanitization is disabled", async () => {
			const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("javascript:alert(1)")}
						action={() => {}}
						config={sanitizeOffConfig}
					/>,
				);
			});

			const clickEvent = clickLinkAndGetEvent(screen.getByRole("link"));
			// preventDefault always runs (native nav killed); the opt-out passes the
			// raw URL to window.open, which the browser blocks for javascript:.
			expect(clickEvent.defaultPrevented).toBe(true);
			expect(openSpy).toHaveBeenCalledWith("javascript:alert(1)", "_blank", "noopener");
		});

		it("opens a safe URL in a new tab via window.open when sanitization is disabled", async () => {
			const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessage("https://example.com/")}
						action={() => {}}
						config={sanitizeOffConfig}
					/>,
				);
			});

			const clickEvent = clickLinkAndGetEvent(screen.getByRole("link"));
			expect(clickEvent.defaultPrevented).toBe(true);
			expect(openSpy).toHaveBeenCalledWith("https://example.com/", "_blank", "noopener");
		});

		it("does not open a blank tab for a missing URL on the opt-out path", async () => {
			const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
			// An empty url renders <a href="">, which has no "link" role, so query
			// the anchor from the DOM directly.
			let container!: HTMLElement;
			await waitFor(() => {
				({ container } = render(
					<Message
						message={webUrlMessage("")}
						action={() => {}}
						config={sanitizeOffConfig}
					/>,
				));
			});

			const anchor = container.querySelector("a");
			expect(anchor).not.toBeNull();
			const clickEvent = clickLinkAndGetEvent(anchor!);
			expect(clickEvent.defaultPrevented).toBe(true);
			expect(openSpy).not.toHaveBeenCalled();
		});

		it("opens a safe URL in the same tab (_self) when the button target is _self", async () => {
			const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
			const message = {
				text: null,
				data: {
					_cognigy: {
						_webchat: {
							message: {
								attachment: {
									type: "template",
									payload: {
										text: "Links",
										template_type: "button",
										buttons: [
											{
												type: "web_url",
												title: "Visit",
												url: "https://example.com/",
												target: "_self",
											},
										],
									},
								},
							},
						},
					},
				},
			} as unknown as IMessage;

			await waitFor(() => {
				render(<Message message={message} action={() => {}} config={sanitizeOnConfig} />);
			});

			const clickEvent = clickLinkAndGetEvent(screen.getByRole("link"));
			expect(clickEvent.defaultPrevented).toBe(true);
			expect(openSpy).toHaveBeenCalledWith("https://example.com/", "_self");
		});

		// A disabled web_url button (no `action` provided, so ActionButtons
		// renders it disabled) must not navigate or execute in either mode.
		describe("disabled buttons do not navigate", () => {
			it("blocks window.open and prevents default when sanitization is on", async () => {
				const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
				await waitFor(() => {
					render(
						<Message
							message={webUrlMessage("https://example.com/")}
							config={sanitizeOnConfig}
						/>,
					);
				});

				const clickEvent = clickLinkAndGetEvent(screen.getByRole("link"));
				expect(clickEvent.defaultPrevented).toBe(true);
				expect(openSpy).not.toHaveBeenCalled();
			});

			it("blocks native navigation of a javascript: URL when sanitization is disabled", async () => {
				const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
				await waitFor(() => {
					render(
						<Message
							message={webUrlMessage("javascript:alert(1)")}
							config={sanitizeOffConfig}
						/>,
					);
				});

				const clickEvent = clickLinkAndGetEvent(screen.getByRole("link"));
				expect(clickEvent.defaultPrevented).toBe(true);
				expect(openSpy).not.toHaveBeenCalled();
			});
		});
	});

	// #83: the "opens in new tab" sr-only announcement must reflect real behavior.
	describe("opens-in-new-tab announcement", () => {
		const webUrlMessageWithTarget = (target?: string) =>
			({
				text: null,
				data: {
					_cognigy: {
						_webchat: {
							message: {
								attachment: {
									type: "template",
									payload: {
										text: "Links",
										template_type: "button",
										buttons: [
											{
												type: "web_url",
												title: "Visit",
												url: "https://example.com/",
												...(target ? { target } : {}),
											},
										],
									},
								},
							},
						},
					},
				},
			}) as unknown as IMessage;

		it("announces new tab for an untargeted web_url when sanitization is on", async () => {
			await waitFor(() => {
				render(<Message message={webUrlMessageWithTarget()} config={sanitizeOnConfig} />);
			});

			expect(screen.getByRole("link").textContent).toContain("Opens in new tab");
		});

		it("announces new tab for an untargeted web_url when sanitization is disabled", async () => {
			// Both modes navigate via window.open(_blank unless _self), so an
			// untargeted URL opens a new tab in the opt-out path too.
			await waitFor(() => {
				render(<Message message={webUrlMessageWithTarget()} config={sanitizeOffConfig} />);
			});

			expect(screen.getByRole("link").textContent).toContain("Opens in new tab");
		});

		it("announces new tab for target=_blank when sanitization is disabled", async () => {
			await waitFor(() => {
				render(
					<Message
						message={webUrlMessageWithTarget("_blank")}
						config={sanitizeOffConfig}
					/>,
				);
			});

			expect(screen.getByRole("link").textContent).toContain("Opens in new tab");
		});
	});
});
