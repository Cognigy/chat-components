import type { Meta, StoryObj } from "@storybook/react";
import ChatEvent from "./ChatEvent";

const meta: Meta<typeof ChatEvent> = {
	title: "Common/ChatEvent",
	component: ChatEvent,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		text: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: "Agent has joined the conversation",
	},
};

export const LongText: Story = {
	args: {
		text: "The conversation has been transferred to a human agent. Please wait while we connect you.",
	},
};

export const ShortText: Story = {
	args: {
		text: "Connected",
	},
};
