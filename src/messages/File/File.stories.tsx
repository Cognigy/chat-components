import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";
import fileFixture from "../../../test/fixtures/file.json";

const meta: Meta<typeof Message> = {
	title: "Messages/File",
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

export const BasicFile: Story = {
	args: {
		message: fileFixture as any,
		action: mockAction,
	},
};
