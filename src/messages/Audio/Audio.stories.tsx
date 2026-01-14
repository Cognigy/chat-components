import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";
import audioFixture from "../../../test/fixtures/audio.json";

const meta: Meta<typeof Message> = {
	title: "Messages/Audio",
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

export const BasicAudio: Story = {
	args: {
		message: audioFixture as any,
		action: mockAction,
	},
};
