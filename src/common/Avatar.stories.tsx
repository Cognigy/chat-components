import type { Meta, StoryObj } from "@storybook/react";
import Avatar from "./Avatar";
import { MessageProvider } from "../messages/context";

const meta: Meta<typeof Avatar> = {
	title: "Common/Avatar",
	component: Avatar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Avatar component requires MessageProvider context
export const Default: Story = {
	render: () => (
		<MessageProvider
			message={{
				text: "Hello",
				source: "bot",
				traceId: "trace-1",
			}}
			action={() => {}}
		>
			<Avatar />
		</MessageProvider>
	),
};
