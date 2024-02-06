import { IWebchatButton, IWebchatQuickReply } from "@cognigy/socket-client";
import { ActionButton } from ".";
import classnames from "classnames";

import classes from "./ActionButtons.module.css";
import { FC, ReactElement } from "react";
import { MessageProps } from "src/messages/Message";
import { getRandomId } from "src/utils";

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

	if (!payload || payload?.length === 0) return null;

	const buttons = payload.filter((button: ActionButtonsProps["payload"][number]) => {
		if ("type" in button && !["postback", "web_url", "phone_number"].includes(button.type))
			return false;

		if ("content_type" in button && button.content_type === "text" && !button.title)
			return false;

		return true;
	});

	const webchatButtonTemplateButtonId = getRandomId("webchatButtonTemplateButton");

	//TODO: add config conditional autofocus on first button

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
		<div
			className={classnames(className, classes.buttons, containerClassName)}
			role={buttons.length > 1 ? "group" : undefined}
			aria-labelledby={
				buttons.length > 1 ? `${templateTextId} srOnly-${templateTextId}` : undefined
			}
			data-testid="action-buttons"
		>
			{buttonElements}
		</div>
	);
};

export default ActionButtons;
