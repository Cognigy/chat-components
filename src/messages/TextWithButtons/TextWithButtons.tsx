import { FC } from "react";

import { Text } from "src/messages";

import classes from "./TextWithButtons.module.css";
import { useMessageContext } from "../hooks";

import { getChannelPayload } from "src/utils";
import ActionButtons from "src/common/ActionButtons/ActionButtons";

/**
 * Combines Text with Buttons + Quick Replies media types as
 * they are same in Webchat v3
 */
const TextWithButtons: FC = () => {
	const { action, message, config } = useMessageContext();

	const payload = getChannelPayload(message, config);

	const text = payload?.message?.attachment?.payload?.text || payload?.message?.text || "";
	const buttons =
		payload?.message?.attachment?.payload?.buttons || payload?.message?.quick_replies || [];

	return (
		<>
			<Text content={text} />
			<ActionButtons
				action={action}
				buttonClassName={classes.button}
				containerClassName={classes.buttons}
				payload={buttons}
				showUrlIcon
			/>
		</>
	);
};

export default TextWithButtons;
