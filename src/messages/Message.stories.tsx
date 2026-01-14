import type { Meta, StoryObj } from "@storybook/react";
import Message from "./Message";
import { CollationProvider } from "./collation";

// Mock action function
const mockAction = (text: string, data?: unknown) => {
	console.log("Message sent:", { text, data });
};

const meta: Meta<typeof Message> = {
	title: "Messages/Message",
	component: Message,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		message: { control: "object" },
		config: { control: "object" },
	},
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

// Basic text message from bot
export const BotTextMessage: Story = {
	args: {
		message: {
			text: "Hello! How can I help you today?",
			source: "bot",
			traceId: "trace-1",
		},
		action: mockAction,
	},
};

// Text message from user
export const UserTextMessage: Story = {
	args: {
		message: {
			text: "I need help with my account",
			source: "user",
			traceId: "trace-2",
		},
		action: mockAction,
	},
};

// Text message with markdown
export const MarkdownMessage: Story = {
	args: {
		message: {
			text: "Here are some **important** points:\n\n- Point 1\n- Point 2\n- Point 3\n\nVisit [our website](https://example.com) for more info.",
			source: "bot",
			traceId: "trace-3",
		},
		action: mockAction,
		config: {
			settings: {
				behavior: {
					renderMarkdown: true,
				},
			},
		},
	},
};

// Long text message
export const LongTextMessage: Story = {
	args: {
		message: {
			text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
			source: "bot",
			traceId: "trace-4",
		},
		action: mockAction,
	},
};

// Message with disabled header
export const MessageWithoutHeader: Story = {
	args: {
		message: {
			text: "This message has no header",
			source: "bot",
			traceId: "trace-5",
		},
		action: mockAction,
		disableHeader: true,
	},
};
