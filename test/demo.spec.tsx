import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Demo } from "./demo";

describe("Demo Page UI", () => {
	it("Default Preview", () => {
		const { asFragment } = render(<Demo />);
		const defaultPreview = screen.getByText(/Default Preview/);
		defaultPreview.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Adaptive Cards", () => {
		const { asFragment } = render(<Demo />);
		const adaptiveCardsPreview = screen.getByText(/Adaptive Cards/);
		adaptiveCardsPreview.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Message Collation", () => {
		const { asFragment } = render(<Demo />);
		const messageCollation = screen.getByText(/Message Collation/);
		messageCollation.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("UI Components", () => {
		const { asFragment } = render(<Demo />);
		const uiComponents = screen.getByText(/UI Components/);
		uiComponents.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Multimedia messages", () => {
		const { asFragment } = render(<Demo />);
		const multimediaMessages = screen.getByText(/Multimedia messages/);
		multimediaMessages.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("List messages", () => {
		const { asFragment } = render(<Demo />);
		const listMessages = screen.getByText(/List messages/);
		listMessages.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Gallery", () => {
		const { asFragment } = render(<Demo />);
		const gallery = screen.getByText(/Gallery/);
		gallery.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Datepicker", () => {
		const { asFragment } = render(<Demo />);
		const datepicker = screen.getByText(/Datepicker/);
		datepicker.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Quick Replies / Buttons", () => {
		const { asFragment } = render(<Demo />);
		const quickReplies = screen.getByText(/Quick Replies \/ Buttons/);
		quickReplies.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Text messages", () => {
		const { asFragment } = render(<Demo />);
		const textMessages = screen.getByText(/Text messages/);
		textMessages.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("Streaming messages with markdown", () => {
		const { asFragment } = render(<Demo />);
		const streamingMessages = screen.getByText(/Streaming messages with markdown/);
		streamingMessages.click();

		expect(asFragment()).toMatchSnapshot();
	});

	it("xApp Buttons", () => {
		const { asFragment } = render(<Demo />);
		const xAppButtons = screen.getByText(/xApp Buttons/);
		xAppButtons.click();

		expect(asFragment()).toMatchSnapshot();
	});
});
