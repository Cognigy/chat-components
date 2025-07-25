import { ButtonHTMLAttributes, ReactElement, forwardRef } from "react";
import classes from "./Buttons.module.css";
import classnames from "classnames";
import ActionButtons, { ActionButtonsProps } from "../ActionButtons/ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client";
import { Button } from ".";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	isActionButton?: boolean;
	action?: ActionButtonsProps["action"];
	button?: IWebchatButton | null;
	buttonClassName?: string;
	containerClassName?: string;
	customIcon?: ReactElement;
	config?: ActionButtonsProps["config"];
	dataMessageId?: string;
	onEmitAnalytics?: ActionButtonsProps["onEmitAnalytics"];
}

const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>((props, ref) => {
	const {
		button,
		customIcon,
		containerClassName,
		buttonClassName,
		action,
		isActionButton,
		config,
		dataMessageId,
		onEmitAnalytics,
		...restProps
	} = props;

	if (!isActionButton)
		return (
			<Button
				{...restProps}
				className={classnames(classes.secondaryButton, classes.button, props.className)}
				ref={ref}
			/>
		);

	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonListItemClassName={classes.buttonListItem}
			buttonClassName={classnames(
				classes.secondaryButton,
				classes.actionButton,
				buttonClassName,
			)}
			dataMessageId={dataMessageId}
			payload={[button]}
			action={action}
			customIcon={customIcon}
			config={config}
			onEmitAnalytics={onEmitAnalytics}
		/>
	);
});

export default SecondaryButton;
