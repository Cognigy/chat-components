import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import gallery from "test/fixtures/gallery.json";
import { WebchatMessage } from "src/messages/types";

describe("Message Gallery", () => {
	const message = gallery as unknown as WebchatMessage;

	it("renders Gallery message", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByTestId("gallery-message")).toBeInTheDocument();
	});

	it("renders images inside gallery", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getAllByAltText("Attachment Image")).toHaveLength(8);
	});

	it("renders subtitles", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getAllByText(/foobar004g2/i)).toHaveLength(3);
	});

	it("renders with navigation arrows", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByLabelText("Next slide")).toBeVisible();
	});

	it("renders with pagination bullets", async () => {
		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(document.querySelector(".swiper-pagination")).toBeInTheDocument();
	});
});
