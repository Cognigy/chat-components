import {
	IWebchatButton,
	IWebchatQuickReply,
} from "@cognigy/socket-client/lib/interfaces/messageData";
import { ActionButton } from ".";
import classnames from "classnames";

import classes from "./ActionButtons.module.css";
import { FC } from "react";
import { MessageProps } from "src/Message";

export interface ActionButtonsProps {
	action?: MessageProps["action"];
	payload: IWebchatButton[] | IWebchatQuickReply[];
	containerClassName?: string;
	buttonClassName?: string;
}

const ActionButtons: FC<ActionButtonsProps> = props => {
	const buttons = props.payload.filter((button: ActionButtonsProps["payload"][number]) => {
		if ((button as any).type === "element_share") return false;
		if ((button as any).content_type === "text" && !button.title) return false;

		return true;
	});

	const buttonElements = buttons.map((button, index: number) => (
		<ActionButton
			className={props.buttonClassName}
			key={index}
			button={button}
			action={props.action}
			position={index + 1}
			total={props.payload.length}
			disabled={props.action === undefined}
		/>
	));

	return (
		<div className={classnames(classes.buttons, props.containerClassName)}>
			{buttonElements}
		</div>
	);
};

export default ActionButtons;
