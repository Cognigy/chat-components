import { FC, HTMLAttributes, ReactElement } from "react";
import classes from "./SingleButtons.module.css";
import classnames from "classnames";
import ActionButtons, { ActionButtonsProps } from "./ActionButtons";
import { IWebchatButton } from "@cognigy/socket-client";
import { useMessageContext } from "src/messages/hooks";

interface PrimaryButtonProps extends HTMLAttributes<HTMLDivElement> {
	action?: ActionButtonsProps["action"];
	button?: IWebchatButton | null;
	buttonClassName?: string;
	containerClassName?: string;
	customIcon?: ReactElement;
}

const PrimaryButton: FC<PrimaryButtonProps> = props => {
	const { button, customIcon, containerClassName, buttonClassName, action } = props;

	const { config, onEmitAnalytics } = useMessageContext();

	if (!button) return null;

	return (
		<ActionButtons
			containerClassName={containerClassName}
			buttonClassName={classnames(classes.primaryButton, buttonClassName)}
			payload={[button]}
			action={action}
			customIcon={customIcon}
			config={config}
			onEmitAnalytics={onEmitAnalytics}
		/>
	);
};

export default PrimaryButton;
