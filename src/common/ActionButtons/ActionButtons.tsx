import { IWebchatButton, IWebchatQuickReply } from "@cognigy/socket-client";
import { ActionButton } from ".";
import classnames from "classnames";
import classes from "./ActionButtons.module.css";
import { FC, ReactElement, useEffect } from "react";
import { MessageProps } from "src/messages/Message";
import { useRandomId } from "src/messages/hooks";
import { interpolateString } from "src/utils";

type buttonPayloadCompatibility = {
	contentType?: string;
};

export interface ActionButtonsProps {
	className?: string;
	action?: MessageProps["action"];
	payload: IWebchatButton[] | Array<IWebchatQuickReply & buttonPayloadCompatibility>;
	containerClassName?: string;
	containerStyle?: React.CSSProperties;
	buttonClassName?: string;
	buttonListItemClassName?: string;
	customIcon?: ReactElement;
	showUrlIcon?: boolean;
	config: MessageProps["config"];
	onEmitAnalytics: MessageProps["onEmitAnalytics"];
	size?: "small" | "large";
	templateTextId?: string;
	openXAppOverlay?: (url: string | undefined) => void;
}

export const ActionButtons: FC<ActionButtonsProps> = props => {
	const {
		className,
		payload,
		buttonClassName,
		buttonListItemClassName,
		containerClassName,
		containerStyle,
		action,
		customIcon,
		showUrlIcon,
		config,
		onEmitAnalytics,
		size,
		templateTextId,
	} = props;

	const webchatButtonTemplateButtonId = useRandomId("webchatButtonTemplateButton");

	useEffect(() => {
		const firstButton = document.getElementById(`${webchatButtonTemplateButtonId}-0`);
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		if (!config?.settings?.widgetSettings?.enableAutoFocus) return;

		if (!chatHistory?.contains(document.activeElement)) return;

		setTimeout(() => {
			firstButton?.focus();
		}, 200);
	}, [config?.settings?.widgetSettings?.enableAutoFocus, webchatButtonTemplateButtonId]);

	if (!payload || payload?.length === 0) return null;

	const buttons = payload.filter((button: ActionButtonsProps["payload"][number]) => {
		if (
			"type" in button &&
			!["postback", "web_url", "phone_number", "openXApp"].includes(button.type)
		)
			return false;

		if ("content_type" in button && button.content_type === "text" && !button.title)
			return false;

		return true;
	});

	const buttonElements = buttons.map((button, index: number) => {
		const actionButton = (
			<ActionButton
				className={buttonClassName}
				button={button}
				action={action}
				disabled={action === undefined}
				position={index + 1}
				total={buttons.length}
				customIcon={customIcon}
				showUrlIcon={showUrlIcon}
				config={config}
				onEmitAnalytics={onEmitAnalytics}
				size={size ? size : "small"}
				id={`${webchatButtonTemplateButtonId}-${index}`}
				key={`${webchatButtonTemplateButtonId}-${index}`}
				openXAppOverlay={props.openXAppOverlay}
			/>
		);

		return buttons.length > 1 ? (
			<li
				key={index}
				className={buttonListItemClassName}
				aria-posinset={index + 1}
				aria-setsize={buttons.length}
			>
				{actionButton}
			</li>
		) : (
			actionButton
		);
	});

	const Component = buttons.length > 1 ? "ul" : "div";

	return (
		<Component
			className={classnames(className, classes.buttons, containerClassName)}
			style={containerStyle || {}}
			aria-labelledby={templateTextId}
			data-testid="action-buttons"
		>
			{buttonElements}
		</Component>
	);
};

export default ActionButtons;
