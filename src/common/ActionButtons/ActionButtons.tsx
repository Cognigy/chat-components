import { IWebchatButton, IWebchatQuickReply } from "@cognigy/socket-client";
import { ActionButton } from ".";
import classnames from "classnames";
import mainClasses from "src/main.module.css";
import classes from "./ActionButtons.module.css";
import { FC, ReactElement, useEffect } from "react";
import { MessageProps } from "src/messages/Message";
import classNames from "classnames";
import { useRandomId } from "src/messages/hooks";

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
			openXAppOverlay={props.openXAppOverlay}
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
				style={containerStyle || {}}
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
