import { ButtonHTMLAttributes, ReactElement, forwardRef } from "react";
import classes from "./Buttons.module.css";
import classnames from "classnames";
import ActionButtons, { ActionButtonsProps } from "../ActionButtons/ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client";
import { Button } from ".";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	isActionButton?: boolean;
	action?: ActionButtonsProps["action"];
	button?: IWebchatButton | null;
	buttonClassName?: string;
	containerClassName?: string;
	customIcon?: ReactElement;
	config?: ActionButtonsProps["config"];
	onEmitAnalytics?: ActionButtonsProps["onEmitAnalytics"];
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>((props, ref) => {
	const {
		button,
		customIcon,
		containerClassName,
		buttonClassName,
		action,
		isActionButton,
		config,
		onEmitAnalytics,
		...restProps
	} = props;

	if (!isActionButton)
		return (
			<Button
				{...restProps}
				icon={customIcon}
				className={classnames(classes.primaryButton, classes.button, props.className)}
				ref={ref}
			/>
		);

	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonListItemClassName={classes.buttonListItem}
			buttonClassName={classnames(
				classes.primaryButton,
				classes.actionButton,
				buttonClassName,
			)}
			payload={[button]}
			action={action}
			customIcon={customIcon}
			config={config}
			onEmitAnalytics={onEmitAnalytics}
		/>
	);
});

export default PrimaryButton;
