import { render, waitFor, screen } from "@testing-library/react";
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
		await waitFor(() => {
			render(<Message message={messageDefault} />);
		});

		expect(screen.getByTestId("agent-avatar")).toHaveAttribute("src", defaultAgentAvatarUrl);
	});

	it("shows the avatar from the avatarUrl prop", async () => {
		await waitFor(() => {
			render(<Message message={messageAvatarUrl} />);
		});

		expect(screen.getByTestId("agent-avatar")).toHaveAttribute("src", customAvatarUrl);
	});

	it("shows the avatar from the override mechanism", async () => {
		await waitFor(() => {
			render(<Message message={messageAvatarOverride} />);
		});

		expect(screen.getByTestId("agent-avatar")).toHaveAttribute(
			"src",
			agentAvatarOverrideUrlOnce,
		);
	});

	it("shows the sender name from the override mechanism", async () => {
		await waitFor(() => {
			render(<Message message={messageAvatarOverride} />);
		});

		expect(screen.getByTestId("sender-name")).toHaveTextContent("Agent Smith");
	});
});

describe("Avatars — c26 mode", () => {
	it("shows user avatar by default when defaultThemeName=c26", async () => {
		await waitFor(() => {
			render(
				<Message
					message={{ text: "Hi", source: "user" } as IMessage}
					defaultThemeName="c26"
				/>,
			);
		});
		expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
	});

	it("hides user avatar when defaultThemeName=c26 and avatarVisibility.user=false", async () => {
		await waitFor(() => {
			render(
				<Message
					message={{ text: "Hi", source: "user" } as IMessage}
					defaultThemeName="c26"
					avatarVisibility={{ user: false }}
				/>,
			);
		});
		expect(screen.queryByTestId("user-avatar")).not.toBeInTheDocument();
	});

	it("shows bot avatar by default when defaultThemeName=c26", async () => {
		await waitFor(() => {
			render(
				<Message
					message={{ text: "Hi", source: "bot" } as IMessage}
					defaultThemeName="c26"
				/>,
			);
		});
		expect(screen.getByTestId("bot-avatar")).toBeInTheDocument();
	});

	it("does not show user avatar in default theme", async () => {
		await waitFor(() => {
			render(
				<Message message={{ text: "Hi", source: "user" } as IMessage} />,
			);
		});
		expect(screen.queryByTestId("user-avatar")).not.toBeInTheDocument();
	});
});
