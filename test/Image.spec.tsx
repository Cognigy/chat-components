import { render, waitFor, screen, fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import image from "test/fixtures/image.json";
import imageDownloadable from "test/fixtures/image-downloadable.json";

describe("Message Image", () => {
	it("renders image message", async () => {
		await waitFor(() => {
			render(<Message message={image} />);
		});

		expect(screen.getByTestId("image-message")).toBeInTheDocument();
	});

	it("should have class 'webchat-media-template-image'", async () => {
		await waitFor(() => {
			render(<Message message={image} />);
		});

		expect(document.querySelector(".webchat-media-template-image")).toBeInTheDocument();
	});

	it("should not have role 'button' and aria-label", async () => {
		await waitFor(() => {
			render(<Message message={image} />);
		});

		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("View Image in fullsize")).not.toBeInTheDocument();
	});

	// Downloadable Image
	it("should have role 'button' and aria-label", async () => {
		await waitFor(() => {
			render(<Message message={imageDownloadable} />);
		});

		expect(screen.queryByRole("button")).toBeInTheDocument();
		expect(screen.queryByLabelText("View Image in fullsize")).toBeInTheDocument();
	});

	// Lightbox
	it("should open and close Lightbox with fullsize image", async () => {
		await waitFor(() => {
			render(<Message message={imageDownloadable} />);
		});

		fireEvent.click(screen.getByRole("button"));

		waitFor(() =>
			expect(screen.getByLabelText("Lightbox")).toBeInTheDocument(),
		);

		waitForElementToBeRemoved(screen.queryByLabelText("Lightbox"));

		fireEvent.click(screen.getByLabelText("Close fullsize image modal"));
	});

});
