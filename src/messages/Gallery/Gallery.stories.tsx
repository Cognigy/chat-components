import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";
import galleryFixture from "../../../test/fixtures/gallery.json";
import galleryWithNullButtonsFixture from "../../../test/fixtures/gallery-with-null-buttons.json";

const meta: Meta<typeof Message> = {
	title: "Messages/Gallery",
	component: Message,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<CollationProvider>
				<Story />
			</CollationProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockAction = (text: string, data?: unknown) => {
	console.log("Action triggered:", { text, data });
};

export const BasicGallery: Story = {
	args: {
		message: galleryFixture as any,
		action: mockAction,
	},
};

export const GalleryWithNullButtons: Story = {
	args: {
		message: galleryWithNullButtonsFixture as any,
		action: mockAction,
	},
};
