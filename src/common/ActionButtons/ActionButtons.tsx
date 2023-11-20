import {
	IWebchatButton,
	IWebchatQuickReply,
} from "@cognigy/socket-client/lib/interfaces/messageData";
import { ActionButton } from ".";
import classnames from "classnames";

import classes from "./ActionButtons.module.css";
import { FC, ReactElement } from "react";
import { MessageProps } from "src/messages/Message";

export interface ActionButtonsProps {
	action?: MessageProps["action"];
	payload: IWebchatButton[] | IWebchatQuickReply[];
	containerClassName?: string;
	buttonClassName?: string;
	customIcon?: ReactElement;
	showUrlIcon?: boolean;
}

const ActionButtons: FC<ActionButtonsProps> = props => {
	const { payload, buttonClassName, containerClassName, action, customIcon, showUrlIcon } = props;
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
		/>
	));

	return (
		<div
			className={classnames(classes.buttons, containerClassName)}
			role={buttons.length > 1 ? "group" : undefined}
			data-testid="action-buttons"
		>
			{buttonElements}
		</div>
	);
};

export default ActionButtons;
