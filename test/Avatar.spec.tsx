import { render, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";
import placeholderAvatar from "src/assets/svg/avatar_placeholder.svg";
import type { IMessage } from "@cognigy/socket-client";

describe("Avatars", () => {
	const defaultAgentAvatarUrl = placeholderAvatar;
	const customAvatarUrl = "https://placewaifu/image/100/100";
	const agentAvatarOverrideUrlOnce = "https://placewaifu/image/300/300";

	const messageDefault = {
		source: "agent" as const,
		text: "default",
	};

	const messageAvatarUrl = {
		avatarUrl: customAvatarUrl,
		source: "agent" as const,
		text: "avatarUrl",
	};

	const messageAvatarOverride = {
		avatarUrl: customAvatarUrl,
		source: "agent" as const,
		text: "_webchat",
		data: {
			_webchat: {
				agentAvatarOverrideUrlOnce,
				agentAvatarOverrideNameOnce: "Agent Smith",
			},
		} as Record<string, unknown>,
	} as unknown as IMessage;

	it("shows placeholder avatar for agent by default", async () => {
		render(<Message message={messageDefault} />);

		expect(await screen.findByTestId("agent-avatar")).toHaveAttribute(
			"src",
			defaultAgentAvatarUrl,
		);
	});

	it("shows the avatar from the avatarUrl prop", async () => {
		render(<Message message={messageAvatarUrl} />);

		expect(await screen.findByTestId("agent-avatar")).toHaveAttribute("src", customAvatarUrl);
	});

	it("shows the avatar from the override mechanism", async () => {
		render(<Message message={messageAvatarOverride} />);

		expect(await screen.findByTestId("agent-avatar")).toHaveAttribute(
			"src",
			agentAvatarOverrideUrlOnce,
		);
	});

	it("shows the sender name from the override mechanism", async () => {
		render(<Message message={messageAvatarOverride} />);

		expect(await screen.findByTestId("sender-name")).toHaveTextContent("Agent Smith");
	});

	// The primary-color background is scoped in CSS to `[data-default-avatar]`, so only the
	// bundled default avatars get it while custom images stay transparent (AB#90506).
	it("marks bundled default avatars with data-default-avatar but not custom images", async () => {
		const { unmount } = render(<Message message={messageDefault} />);
		expect(await screen.findByTestId("agent-avatar")).toHaveAttribute("data-default-avatar");
		unmount();

		render(<Message message={messageAvatarUrl} />);
		expect(await screen.findByTestId("agent-avatar")).not.toHaveAttribute("data-default-avatar");
	});
});

describe("Avatars — c26 mode", () => {
	it("shows user avatar by default when defaultThemeName=c26", async () => {
		render(
			<Message message={{ text: "Hi", source: "user" } as IMessage} defaultThemeName="c26" />,
		);
		expect(await screen.findByTestId("user-avatar")).toBeInTheDocument();
	});

	it("hides user avatar when defaultThemeName=c26 and avatarVisibility.user=false", async () => {
		render(
			<Message
				message={{ text: "Hi", source: "user" } as IMessage}
				defaultThemeName="c26"
				avatarVisibility={{ user: false }}
			/>,
		);
		await screen.findByText("Hi");
		expect(screen.queryByTestId("user-avatar")).not.toBeInTheDocument();
	});

	it("shows bot avatar by default when defaultThemeName=c26", async () => {
		render(
			<Message message={{ text: "Hi", source: "bot" } as IMessage} defaultThemeName="c26" />,
		);
		expect(await screen.findByTestId("bot-avatar")).toBeInTheDocument();
	});

	it("does not show user avatar in default theme", async () => {
		render(<Message message={{ text: "Hi", source: "user" } as IMessage} />);
		await screen.findByText("Hi");
		expect(screen.queryByTestId("user-avatar")).not.toBeInTheDocument();
	});
});
