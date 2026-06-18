import { render, waitFor, fireEvent } from "@testing-library/react";
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
});
