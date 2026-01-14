import type { Meta, StoryObj } from "@storybook/react";
import Message from "../Message";
import { CollationProvider } from "../collation";
import singleDateFixture from "../../../test/fixtures/datepicker/singleDate.json";
import singleDateMinMaxFixture from "../../../test/fixtures/datepicker/singleDateWithMinMax.json";
import multipleDateFixture from "../../../test/fixtures/datepicker/multiple.json";
import rangeDateFixture from "../../../test/fixtures/datepicker/range.json";
import weekNumbersFixture from "../../../test/fixtures/datepicker/weekNumbers.json";
import noTimeFixture from "../../../test/fixtures/datepicker/noTime.json";
import timeOnlyFixture from "../../../test/fixtures/datepicker/timeOnly.json";
import disableWeekendsFixture from "../../../test/fixtures/datepicker/disableWeekends.json";

const meta: Meta<typeof Message> = {
	title: "Messages/DatePicker",
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
	console.log("Date selected:", { text, data });
};

export const SingleDate: Story = {
	args: {
		message: singleDateFixture as any,
		action: mockAction,
	},
};

export const SingleDateWithMinMax: Story = {
	args: {
		message: singleDateMinMaxFixture as any,
		action: mockAction,
	},
};

export const MultipleDates: Story = {
	args: {
		message: multipleDateFixture as any,
		action: mockAction,
	},
};

export const DateRange: Story = {
	args: {
		message: rangeDateFixture as any,
		action: mockAction,
	},
};

export const WithWeekNumbers: Story = {
	args: {
		message: weekNumbersFixture as any,
		action: mockAction,
	},
};

export const NoTime: Story = {
	args: {
		message: noTimeFixture as any,
		action: mockAction,
	},
};

export const TimeOnly: Story = {
	args: {
		message: timeOnlyFixture as any,
		action: mockAction,
	},
};

export const DisableWeekends: Story = {
	args: {
		message: disableWeekendsFixture as any,
		action: mockAction,
	},
};
