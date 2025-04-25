import { FC, useEffect, useRef, useState } from "react";

import { Text } from "src/messages";

import classes from "./TextWithButtons.module.css";
import { useMessageContext, useRandomId } from "../hooks";

import { getChannelPayload } from "src/utils";
import ActionButtons from "src/common/ActionButtons/ActionButtons";
import { IWebchatTemplateAttachment } from "@cognigy/socket-client";
import classNames from "classnames";
import { IStreamingMessage } from "../types";

interface ITextWithButtonsProps {
	onSetMessageAnimated?: (
		messageId: string,
		animationState: IStreamingMessage["animationState"],
	) => void;
	onSetLiveRegionContent?: (text: string) => void;
}

/**
 * Combines Text with Buttons + Quick Replies media types as
 * they are same in Webchat v3
 *
 * Currently, QR buttons template behaves differently to "Text with Buttons":
 * - QR buttons get disabled when there is a reply in chat from the user
 */
const TextWithButtons: FC = (props: ITextWithButtonsProps) => {
	const { onSetMessageAnimated, onSetLiveRegionContent } = props;
	const [textContent, setScreenReaderTextContent] = useState<string>("");
	const [buttonLabels, setScreenReaderButtonLabels] = useState<string[]>([]);
	const previousLiveContentRef = useRef<string | undefined>(undefined);

	const { action, message, config, onEmitAnalytics, messageParams, openXAppOverlay } =
		useMessageContext();

	const progressiveMessageRendering = !!config?.settings?.behavior?.progressiveMessageRendering;
	const botOutputMaxWidthPercentage = config?.settings?.layout?.botOutputMaxWidthPercentage;

	const isBotMessage = message.source === "bot";
	const isEngagementMessage = message.source === "engagement";

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

	useEffect(() => {
		const getLiveRegionContent = () => {
			if (!!textContent && buttonLabels.length > 0) {
				return `${textContent}${buttonLabels.length > 0 ? " Available options: " + buttonLabels.join(", ") : ""}`;
			}
		};

		const liveRegionContent = getLiveRegionContent();
		if (liveRegionContent && liveRegionContent !== previousLiveContentRef.current) {
			onSetLiveRegionContent?.(liveRegionContent);
			previousLiveContentRef.current = liveRegionContent;
		}
	}, [textContent, buttonLabels, onSetLiveRegionContent]);

	const stillAnimating =
		(message as IStreamingMessage).animationState === "animating" ||
		(message as IStreamingMessage).animationState === "start";

	const webchatButtonTemplateTextId = useRandomId("webchatButtonTemplateHeader");

	const payload = getChannelPayload(message, config);

	const isQuickReplies =
		payload?.message?.quick_replies && payload.message.quick_replies.length > 0;

	const attachments = payload?.message?.attachment as IWebchatTemplateAttachment;
	const text = attachments?.payload?.text || payload?.message?.text || "";
	const buttons = attachments?.payload?.buttons || payload?.message?.quick_replies || [];

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
					onSetScreenReaderBtnLabel={setScreenReaderTextContent}
				/>
			)}

			{(!progressiveMessageRendering || !stillAnimating) && (
				<ActionButtons
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
					onSetScreenReaderBtnLabel={label =>
						setScreenReaderButtonLabels(prev => [...prev, label])
					}
				/>
			)}
		</div>
	);
};

export default TextWithButtons;
