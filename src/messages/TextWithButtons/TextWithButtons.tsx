import { FC, useEffect, useMemo } from "react";

import { Text } from "src/messages";

import classes from "./TextWithButtons.module.css";
import { useLiveRegion, useMessageContext, useRandomId } from "../hooks";

import { getChannelPayload } from "src/utils";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { IWebchatTemplateAttachment } from "@cognigy/socket-client";
import classNames from "classnames";
import { IStreamingMessage } from "../types";
import { getTextWithButtonsContent } from "./helper";

interface ITextWithButtonsProps {
	onSetMessageAnimated?: (
		messageId: string,
		animationState: IStreamingMessage["animationState"],
	) => void;
}

/**
 * Combines Text with Buttons + Quick Replies media types as
 * they are same in Webchat v3
 *
 * Currently, QR buttons template behaves differently to "Text with Buttons":
 * - QR buttons get disabled when there is a reply in chat from the user
 */
const TextWithButtons: FC = (props: ITextWithButtonsProps) => {
	const { onSetMessageAnimated } = props;

	const {
		action,
		message,
		config,
		onEmitAnalytics,
		messageParams,
		openXAppOverlay,
		"data-message-id": dataMessageId,
	} = useMessageContext();

	const progressiveMessageRendering = !!config?.settings?.behavior?.progressiveMessageRendering;
	const botOutputMaxWidthPercentage = config?.settings?.layout?.botOutputMaxWidthPercentage;

	const isBotMessage = message.source === "bot";
	const isEngagementMessage = message.source === "engagement";

	const payload = getChannelPayload(message, config);

	const attachments = payload?.message?.attachment as IWebchatTemplateAttachment;
	const text = attachments?.payload?.text || payload?.message?.text || "";
	const buttons = useMemo(
		() => attachments?.payload?.buttons || payload?.message?.quick_replies || [],
		[attachments?.payload?.buttons, payload?.message?.quick_replies],
	);

	useEffect(() => {
		if (
			progressiveMessageRendering &&
			(isBotMessage || isEngagementMessage) &&
			onSetMessageAnimated &&
			message.id &&
			message.animationState === "start" &&
			!message.text
		) {
			onSetMessageAnimated(message.id as string, "done");
		}
	}, [
		progressiveMessageRendering,
		isBotMessage,
		isEngagementMessage,
		onSetMessageAnimated,
		message.id,
		message.animationState,
		message.text,
	]);

	const isSanitizeEnabled = !config?.settings?.layout?.disableHtmlContentSanitization;
	const customAllowedHtmlTags = config?.settings?.widgetSettings?.customAllowedHtmlTags;

	const textWithButtonsContent = useMemo(() => {
		return getTextWithButtonsContent(
			{ text, buttons },
			isSanitizeEnabled,
			customAllowedHtmlTags,
		);
	}, [text, buttons, isSanitizeEnabled, customAllowedHtmlTags]);

	const { textContent, buttonLabels } = textWithButtonsContent;

	useLiveRegion({
		messageType: "textWithButtons",
		data: { text: textContent, buttons: buttonLabels },
		validation: () => buttonLabels.length === buttons.length,
	});

	const stillAnimating =
		(message as IStreamingMessage).animationState === "animating" ||
		(message as IStreamingMessage).animationState === "start";

	const webchatButtonTemplateTextId = useRandomId("webchatButtonTemplateHeader");

	const isQuickReplies =
		payload?.message?.quick_replies && payload.message.quick_replies.length > 0;

	const shouldBeDisabled =
		(isQuickReplies && messageParams?.hasReply) || messageParams?.isConversationEnded;
	const modifiedAction = shouldBeDisabled ? undefined : action;

	const classType = isQuickReplies ? "quick-reply" : "buttons";

	const containerStyle =
		isBotMessage || (isEngagementMessage && botOutputMaxWidthPercentage)
			? { maxWidth: `${botOutputMaxWidthPercentage}%` }
			: {};

	return (
		<div className={`webchat-${classType}-template-root`}>
			{text && (
				<Text
					{...props}
					content={text}
					className={`webchat-${classType}-template-header`}
					id={webchatButtonTemplateTextId}
					ignoreLiveRegion
				/>
			)}

			{(!progressiveMessageRendering || !stillAnimating) && (
				<ActionButtons
					dataMessageId={dataMessageId}
					action={modifiedAction}
					buttonClassName={classNames(
						classes.button,
						`webchat-${classType}-template-button`,
					)}
					containerClassName={classNames(
						classes.buttons,
						isQuickReplies && "webchat-quick-reply-template-replies-container",
					)}
					containerStyle={containerStyle}
					payload={buttons}
					showUrlIcon
					config={config}
					onEmitAnalytics={onEmitAnalytics}
					templateTextId={webchatButtonTemplateTextId}
					openXAppOverlay={openXAppOverlay}
				/>
			)}
		</div>
	);
};

export default TextWithButtons;
