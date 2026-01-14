import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";
import imageFixture from "../../../test/fixtures/image.json";
import imageDownloadableFixture from "../../../test/fixtures/image-downloadable.json";
import imageBrokenFixture from "../../../test/fixtures/imageBroken.json";

const meta: Meta<typeof Message> = {
	title: "Messages/Image",
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

export const BasicImage: Story = {
	args: {
		message: imageFixture as any,
		action: mockAction,
	},
};

export const DownloadableImage: Story = {
	args: {
		message: imageDownloadableFixture as any,
		action: mockAction,
	},
};

export const BrokenImage: Story = {
	args: {
		message: imageBrokenFixture as any,
		action: mockAction,
	},
};
