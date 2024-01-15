import { render } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import gallery from "test/fixtures/gallery.json";
import { IMessage } from "@cognigy/socket-client";

describe("Message Gallery", () => {
	const message = gallery as unknown as IMessage;

	it("renders Gallery message", () => {
		const { getByTestId } = render(<Message message={message} />);

		expect(getByTestId("gallery-message")).toBeInTheDocument();
	});

	it("renders images inside gallery", () => {
		const { getAllByAltText } = render(<Message message={message} />);

		expect(getAllByAltText("Attachment Image")).toHaveLength(8);
	});

	it("renders subtitles", () => {
		const { getAllByText } = render(<Message message={message} />);

		expect(getAllByText(/foobar004g2/i)).toHaveLength(3);
	});

	it("renders with navigation arrows", () => {
		const { getByLabelText } = render(<Message message={message} />);

		expect(getByLabelText("Next slide")).toBeVisible();
	});

	it("renders with pagination bullets", () => {
		render(<Message message={message} />);

		expect(document.querySelector(".swiper-pagination")).toBeInTheDocument();
	});
});
