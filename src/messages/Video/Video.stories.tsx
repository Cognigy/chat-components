import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";
import videoFixture from "../../../test/fixtures/video.json";
import videoYoutubeFixture from "../../../test/fixtures/videoYoutube.json";
import videoAltTextFixture from "../../../test/fixtures/videoWithAltText.json";

const meta: Meta<typeof Message> = {
	title: "Messages/Video",
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

export const BasicVideo: Story = {
	args: {
		message: videoFixture as any,
		action: mockAction,
	},
};

export const YouTubeVideo: Story = {
	args: {
		message: videoYoutubeFixture as any,
		action: mockAction,
	},
};

export const VideoWithAltText: Story = {
	args: {
		message: videoAltTextFixture as any,
		action: mockAction,
	},
};
