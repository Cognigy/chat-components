import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "src/messages/Message";

describe("Avatars", () => {
	const defaultAgentAvatarUrl = "/src/assets/svg/avatar_placeholder.svg";
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
		},
	} as any;

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
