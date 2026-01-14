import type { Meta, StoryObj } from "@storybook/react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const meta: Meta<typeof PrimaryButton> = {
	title: "Common/Buttons",
	component: PrimaryButton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		onClick: { action: "clicked" },
		disabled: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	render: (args) => <PrimaryButton {...args}>Primary Button</PrimaryButton>,
	args: {
		disabled: false,
	},
};

export const PrimaryDisabled: Story = {
	render: (args) => <PrimaryButton {...args}>Disabled Button</PrimaryButton>,
	args: {
		disabled: true,
	},
};

export const Secondary: Story = {
	render: (args) => <SecondaryButton {...args}>Secondary Button</SecondaryButton>,
	args: {
		disabled: false,
	},
};

export const SecondaryDisabled: Story = {
	render: (args) => <SecondaryButton {...args}>Disabled Secondary</SecondaryButton>,
	args: {
		disabled: true,
	},
};
