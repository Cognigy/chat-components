import { FC } from "react";

import { Text } from "src/messages";

import classes from "./TextWithButtons.module.css";
import { useMessageContext } from "../hooks";

import { getChannelPayload } from "src/utils";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { IWebchatTemplateAttachment } from "@cognigy/socket-client";

/**
 * Combines Text with Buttons + Quick Replies media types as
 * they are same in Webchat v3
 *
 * Currently, QR buttons template behaves differently to "Text with Buttons":
 * - QR buttons get disabled when there is a reply in chat from the user
 */
const TextWithButtons: FC = () => {
	const { action, message, config, onEmitAnalytics, messageParams } = useMessageContext();

	const payload = getChannelPayload(message, config);

	const isQuickReplies =
		payload?.message?.quick_replies && payload.message.quick_replies.length > 0;

	const attachments = payload?.message?.attachment as IWebchatTemplateAttachment;
	const text = attachments?.payload?.text || payload?.message?.text || "";
	const buttons = attachments?.payload?.buttons || payload?.message?.quick_replies || [];

	const shouldBeDisabled = isQuickReplies && messageParams?.hasReply;
	const modifiedAction = shouldBeDisabled ? undefined : action;

	return (
		<>
			<Text content={text} />
			<ActionButtons
				action={modifiedAction}
				buttonClassName={classes.button}
				containerClassName={classes.buttons}
				payload={buttons}
				showUrlIcon
				config={config}
				onEmitAnalytics={onEmitAnalytics}
			/>
		</>
	);
};

export default TextWithButtons;
