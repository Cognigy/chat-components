import { FC } from "react";

import { Text } from "src/messages";

import classes from "./TextWithButtons.module.css";
import mainClasses from "src/main.module.css";
import { useMessageContext } from "../hooks";

import { getChannelPayload, getRandomId } from "src/utils";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { IWebchatTemplateAttachment } from "@cognigy/socket-client";
import classNames from "classnames";

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

	const webchatButtonTemplateTextId = getRandomId("webchatButtonTemplateHeader");
	const classType = isQuickReplies ? "quick-reply" : "buttons";

	return (
		<div className={`webchat-${classType}-template-root`}>
			<Text
				content={text}
				className={`webchat-${classType}-template-header`}
				id={webchatButtonTemplateTextId}
			/>

			{buttons.length > 1 && (
				<span
					className={classNames(mainClasses.srOnly, "sr-only")}
					id={`srOnly-${webchatButtonTemplateTextId}`}
				>
					With {buttons?.length} buttons or links in
				</span>
			)}

			<ActionButtons
				action={modifiedAction}
				buttonClassName={classNames(classes.button, `webchat-${classType}-template-button`)}
				containerClassName={classNames(
					classes.buttons,
					isQuickReplies && "webchat-quick-reply-template-replies-container",
				)}
				payload={buttons}
				showUrlIcon
				config={config}
				onEmitAnalytics={onEmitAnalytics}
				templateTextId={webchatButtonTemplateTextId}
			/>
		</div>
	);
};

export default TextWithButtons;
