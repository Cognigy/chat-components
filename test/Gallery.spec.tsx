import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import gallery from "test/fixtures/gallery.json";

describe("Message Gallery", () => {
	it("renders Gallery message", async () => {
		await waitFor(() => {
			render(<Message message={gallery} />);
		});

		expect(screen.getByTestId("gallery-message")).toBeInTheDocument();
    });
    
    it("renders images inside gallery", async () => {
		await waitFor(() => {
			render(<Message message={gallery} />);
		});

		expect(screen.getAllByAltText("Attachment Image")).toHaveLength(7);
    });
    
    it("renders subtitles", async () => {
		await waitFor(() => {
			render(<Message message={gallery} />);
		});

		expect(screen.getAllByText(/foobar004g2/i)).toHaveLength(3);
    });
    
    it("renders with navigation arrows", async () => {
		await waitFor(() => {
			render(<Message message={gallery} />);
		});

		expect(screen.getByLabelText("Next slide")).toBeVisible();
    });
    
    it("renders with pagination bullets", async () => {
		await waitFor(() => {
			render(<Message message={gallery} />);
		});

		expect(document.querySelector(".swiper-pagination")).toBeInTheDocument();
	});
});
