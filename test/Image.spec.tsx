import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import image from "test/fixtures/image.json";

describe("Message Image", () => {
	it("renders image message", async () => {
		await waitFor(() => {
			render(<Message message={image} />);
		});

		expect(screen.getByTestId("image-message")).toBeInTheDocument();
	});

	// TODO: test all image templates and downloadable features (button / lightbox)
	// when data structure tasks will be completed
});
