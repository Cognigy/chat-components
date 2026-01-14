import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";
import adaptiveCardsFixture from "../../../test/fixtures/adaptiveCards.json";

const meta: Meta<typeof Message> = {
	title: "Messages/AdaptiveCards",
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

export const SimpleCard: Story = {
	args: {
		message: adaptiveCardsFixture[0] as any,
		action: mockAction,
	},
};

export const CardWithImage: Story = {
	args: {
		message: adaptiveCardsFixture[1] as any,
		action: mockAction,
	},
};

export const InputCard: Story = {
	args: {
		message: adaptiveCardsFixture[2] as any,
		action: mockAction,
	},
};
