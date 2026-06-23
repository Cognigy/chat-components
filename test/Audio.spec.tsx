import { render, waitFor, fireEvent, act } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import audio from "test/fixtures/audio.json";
import { IMessage } from "@cognigy/socket-client";

describe("Message Audio", () => {
	const message = audio as unknown as IMessage;

	it("renders audio message", async () => {
		const { getByTestId } = render(<Message message={message} />);

		await waitFor(() => {
			expect(getByTestId("audio-message")).toBeInTheDocument();
		});
	});

	it("renders audio message with custom skin controls", async () => {
		const { getByTestId } = render(<Message message={message} />);

		await waitFor(() => {
			expect(getByTestId("audio-message").querySelector("audio")).not.toBeVisible();
			expect(getByTestId("audio-controls")).toBeVisible();
		});
	});

	it("renders volume slider and mute button", async () => {
		const { getByTestId } = render(<Message message={message} />);

		await waitFor(() => {
			expect(getByTestId("volume-slider")).toBeInTheDocument();
			expect(getByTestId("mute-button")).toBeInTheDocument();
		});
	});

	it("volume slider starts at full volume", async () => {
		const { getByTestId } = render(<Message message={message} />);

		const slider = await waitFor(() => getByTestId("volume-slider"));
		expect((slider as HTMLInputElement).value).toBe("1");
	});

	it("volume slider has human-readable aria-valuetext", async () => {
		const { getByTestId } = render(<Message message={message} />);

		const slider = await waitFor(() => getByTestId("volume-slider"));
		expect(slider).toHaveAttribute("aria-valuetext", "Audio volume 100%");
	});

	it("mute button toggles aria-label on click", async () => {
		const { getByTestId } = render(<Message message={message} />);

		const muteButton = await waitFor(() => getByTestId("mute-button"));
		expect(muteButton).toHaveAttribute("aria-label", "Mute audio");

		fireEvent.click(muteButton);
		expect(muteButton).toHaveAttribute("aria-label", "Unmute audio");

		fireEvent.click(muteButton);
		expect(muteButton).toHaveAttribute("aria-label", "Mute audio");
	});

	it("muting sets volume slider to 0", async () => {
		const { getByTestId } = render(<Message message={message} />);

		const muteButton = await waitFor(() => getByTestId("mute-button"));
		const slider = getByTestId("volume-slider") as HTMLInputElement;

		expect(slider.value).toBe("1");
		fireEvent.click(muteButton);
		expect(slider.value).toBe("0");
	});

	it("unmuting restores previous volume level", async () => {
		const { getByTestId } = render(<Message message={message} />);

		const muteButton = await waitFor(() => getByTestId("mute-button"));
		const slider = getByTestId("volume-slider") as HTMLInputElement;

		fireEvent.click(muteButton);
		expect(slider.value).toBe("0");

		fireEvent.click(muteButton);
		expect(slider.value).toBe("1");
	});

	describe("Options menu", () => {
		it("opens on click and shows menu items", async () => {
			const { getByRole, queryByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			expect(queryByRole("menu")).not.toBeInTheDocument();
			fireEvent.click(trigger);
			expect(getByRole("menu")).toBeInTheDocument();
			expect(getByRole("menuitem", { name: /Download transcript/i })).toBeInTheDocument();
			expect(getByRole("menuitem", { name: /Playback speed/i })).toBeInTheDocument();
		});

		it("closes on Escape and returns focus to trigger", async () => {
			const { getByRole, queryByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			const menu = getByRole("menu");

			fireEvent.keyDown(menu, { key: "Escape" });

			expect(queryByRole("menu")).not.toBeInTheDocument();
			expect(document.activeElement).toBe(trigger);
		});

		it("focuses first menu item on open", async () => {
			const { getByRole, getAllByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);

			await waitFor(() => {
				expect(document.activeElement).toBe(getAllByRole("menuitem")[0]);
			});
		});

		it("ArrowDown moves focus to next item and wraps from last to first", async () => {
			const { getByRole, getAllByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			await waitFor(() => expect(document.activeElement).toBe(getAllByRole("menuitem")[0]));

			const menu = getByRole("menu");
			fireEvent.keyDown(menu, { key: "ArrowDown" });
			expect(document.activeElement).toBe(getAllByRole("menuitem")[1]);

			fireEvent.keyDown(menu, { key: "ArrowDown" });
			expect(document.activeElement).toBe(getAllByRole("menuitem")[0]);
		});

		it("ArrowUp wraps from first to last item", async () => {
			const { getByRole, getAllByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			await waitFor(() => expect(document.activeElement).toBe(getAllByRole("menuitem")[0]));

			const menu = getByRole("menu");
			fireEvent.keyDown(menu, { key: "ArrowUp" });

			const items = getAllByRole("menuitem");
			expect(document.activeElement).toBe(items[items.length - 1]);
		});

		it("Tab closes the menu", async () => {
			const { getByRole, queryByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			expect(getByRole("menu")).toBeInTheDocument();

			fireEvent.keyDown(getByRole("menu"), { key: "Tab" });
			expect(queryByRole("menu")).not.toBeInTheDocument();
		});

		it("closes the menu on scroll", async () => {
			const { getByRole, queryByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			expect(getByRole("menu")).toBeInTheDocument();

			// The scroll-close listener is armed one animation frame after open, so
			// the open-time auto-scroll is ignored. Flush that frame before scrolling.
			await act(
				() => new Promise(resolve => requestAnimationFrame(() => resolve(undefined))),
			);

			fireEvent.scroll(window);
			await waitFor(() => expect(queryByRole("menu")).not.toBeInTheDocument());
		});

		it("ignores the auto-scroll fired at open time (stays open)", async () => {
			const { getByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			// A scroll dispatched before the arming frame (e.g. the browser revealing
			// a clipped trigger) must NOT dismiss the menu.
			fireEvent.scroll(window);
			expect(getByRole("menu")).toBeInTheDocument();
		});

		it("navigates into playback speed submenu and focuses the active speed", async () => {
			const { getByRole, getAllByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			fireEvent.click(getByRole("menuitem", { name: /Playback speed/i }));

			await waitFor(() => {
				expect(getAllByRole("menuitemradio").length).toBe(6);
				// default playbackRate is 1 — "Normal speed" item should be focused
				expect(document.activeElement).toHaveAttribute("aria-checked", "true");
			});
		});

		it("ArrowRight on Playback speed item opens speed submenu", async () => {
			const { getByRole, getAllByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			await waitFor(() => expect(document.activeElement).toBe(getAllByRole("menuitem")[0]));

			// Move focus to Playback speed item (last menuitem)
			const menu = getByRole("menu");
			fireEvent.keyDown(menu, { key: "ArrowDown" });
			expect((document.activeElement as HTMLElement).getAttribute("aria-haspopup")).toBe(
				"menu",
			);

			fireEvent.keyDown(menu, { key: "ArrowRight" });
			await waitFor(() => {
				expect(getAllByRole("menuitemradio").length).toBe(6);
			});
		});

		it("ArrowLeft in speed view goes back to main menu", async () => {
			const { getByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			fireEvent.click(getByRole("menuitem", { name: /Playback speed/i }));

			await waitFor(() => getByRole("menuitemradio", { name: /Normal speed/i }));

			// ArrowLeft exits the speed submenu — need to query the nested menu
			const menus = document.querySelectorAll('[role="menu"]');
			const innerMenu = menus[menus.length - 1] as HTMLElement;
			fireEvent.keyDown(innerMenu, { key: "ArrowLeft" });

			await waitFor(() => {
				expect(getByRole("menuitem", { name: /Download transcript/i })).toBeInTheDocument();
			});
		});

		it("Escape in speed view goes back to main menu (not close)", async () => {
			const { getByRole, queryByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			fireEvent.click(getByRole("menuitem", { name: /Playback speed/i }));

			await waitFor(() => getByRole("menuitemradio", { name: /Normal speed/i }));

			const menus = document.querySelectorAll('[role="menu"]');
			const innerMenu = menus[menus.length - 1] as HTMLElement;
			fireEvent.keyDown(innerMenu, { key: "Escape" });

			await waitFor(() => {
				// Menu stays open, returns to main view
				expect(getByRole("menuitem", { name: /Download transcript/i })).toBeInTheDocument();
				expect(queryByRole("menuitemradio")).not.toBeInTheDocument();
			});
		});

		it("selecting a playback speed closes the menu and returns focus to trigger", async () => {
			const { getByRole, getAllByRole, queryByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			fireEvent.click(getByRole("menuitem", { name: /Playback speed/i }));

			await waitFor(() => expect(getAllByRole("menuitemradio").length).toBeGreaterThan(0));
			fireEvent.click(getAllByRole("menuitemradio")[2]); // 1× Normal

			expect(queryByRole("menu")).not.toBeInTheDocument();
			expect(document.activeElement).toBe(trigger);
		});

		it("selecting a playback speed announces the new speed via live region", async () => {
			const { getByRole, getAllByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			fireEvent.click(getByRole("menuitem", { name: /Playback speed/i }));

			await waitFor(() => expect(getAllByRole("menuitemradio").length).toBeGreaterThan(0));
			fireEvent.click(getAllByRole("menuitemradio")[0]); // 0.5× speed

			const liveRegion = document.querySelector("[aria-live='polite']");
			expect(liveRegion).toHaveTextContent("Playback speed: 0.5 times speed");
		});

		it("activating Download transcript closes the menu and returns focus to trigger", async () => {
			const { getByRole, queryByRole } = render(<Message message={message} />);
			const trigger = await waitFor(() => getByRole("button", { name: "More options" }));

			fireEvent.click(trigger);
			fireEvent.click(getByRole("menuitem", { name: /Download transcript/i }));

			expect(queryByRole("menu")).not.toBeInTheDocument();
			expect(document.activeElement).toBe(trigger);
		});
	});
});
