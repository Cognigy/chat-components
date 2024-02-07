import { IWebchatButton, IWebchatQuickReply } from "@cognigy/socket-client";
import { ActionButton } from ".";
import classnames from "classnames";
import mainClasses from "src/main.module.css";
import classes from "./ActionButtons.module.css";
import { FC, ReactElement, useEffect, useMemo } from "react";
import { MessageProps } from "src/messages/Message";
import { getRandomId } from "src/utils";
import classNames from "classnames";

export interface ActionButtonsProps {
	className?: string;
	action?: MessageProps["action"];
	payload: IWebchatButton[] | IWebchatQuickReply[];
	containerClassName?: string;
	buttonClassName?: string;
	customIcon?: ReactElement;
	showUrlIcon?: boolean;
	config: MessageProps["config"];
	onEmitAnalytics: MessageProps["onEmitAnalytics"];
	size?: "small" | "large";
	templateTextId?: string;
}

export const ActionButtons: FC<ActionButtonsProps> = props => {
	const {
		className,
		payload,
		buttonClassName,
		containerClassName,
		action,
		customIcon,
		showUrlIcon,
		config,
		onEmitAnalytics,
		size,
		templateTextId,
	} = props;

	const webchatButtonTemplateButtonId = useMemo(
		() => getRandomId("webchatButtonTemplateButton"),
		[],
	);

	useEffect(() => {
		const firstButton = document.getElementById(`${webchatButtonTemplateButtonId}-0`);
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		if (!config?.settings.enableAutoFocus) return;

		if (!chatHistory?.contains(document.activeElement)) return;

		setTimeout(() => {
			firstButton?.focus();
		}, 200);
	}, [config?.settings.enableAutoFocus, webchatButtonTemplateButtonId]);

	if (!payload || payload?.length === 0) return null;

	const buttons = payload.filter((button: ActionButtonsProps["payload"][number]) => {
		if ("type" in button && !["postback", "web_url", "phone_number"].includes(button.type))
			return false;

		if ("content_type" in button && button.content_type === "text" && !button.title)
			return false;

		return true;
	});

	const buttonElements = buttons.map((button, index: number) => (
		<ActionButton
			className={buttonClassName}
			key={index}
			button={button}
			action={action}
			position={index + 1}
			total={payload.length}
			disabled={action === undefined}
			customIcon={customIcon}
			showUrlIcon={showUrlIcon}
			config={config}
			onEmitAnalytics={onEmitAnalytics}
			size={size ? size : "small"}
			id={`${webchatButtonTemplateButtonId}-${index}`}
		/>
	));

	return (
		<>
			{buttons.length > 1 && templateTextId && (
				<span
					className={classNames(mainClasses.srOnly, "sr-only")}
					id={`srOnly-${templateTextId}`}
				>
					{`With ${buttons.length} buttons or links in`}
				</span>
			)}
			<div
				className={classnames(className, classes.buttons, containerClassName)}
				role={buttons.length > 1 ? "group" : undefined}
				aria-labelledby={
					buttons.length > 1 && templateTextId
						? `${templateTextId} srOnly-${templateTextId}`
						: undefined
				}
				data-testid="action-buttons"
			>
				{buttonElements}
			</div>
		</>
	);
};

export default ActionButtons;
