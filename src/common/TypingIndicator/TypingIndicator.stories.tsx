import type { Meta, StoryObj } from "@storybook/react";
import TypingIndicator from "./TypingIndicator";

const meta: Meta<typeof TypingIndicator> = {
	title: "Common/TypingIndicator",
	component: TypingIndicator,
	parameters: {
		layout: "centered",
		backgrounds: {
			default: "chat-bg",
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
