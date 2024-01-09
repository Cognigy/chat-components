import { useCallback } from "react";
import classnames from "classnames";

import AdaptiveCard from "./components/Adaptivecard";
import { useMessageContext } from "../hooks";
import styles from "./styles.module.css";

import type { IMessage } from "@cognigy/socket-client";
import ChatBubble from "src/common/ChatBubble";
import { HostConfig } from "adaptivecards";

const adaptiveCardsHostConfig: HostConfig = {
	fontFamily: "inherit",
	fontSizes: {
		small: 10,
		default: 14,
		medium: 16,
		large: 18,
		extraLarge: 34,
	},
	fontWeights: {
		lighter: 300,
		default: 400,
		bolder: 600,
	},
	lineHeights: {
		small: 12,
		default: 18.2,
		medium: 22.4,
		large: 23.4,
		extraLarge: 40.8,
	},

	containerStyles: {
		default: {
			backgroundColor: "#fff0",
			foregroundColors: {
				default: "var(--black-10)",
				subtle: "var(--black-40)",
			},
		},
		emphasis: {
			backgroundColor: "#F0F0F0",
			foregroundColors: {
				default: {
					default: "#333333",
					subtle: "#EE333333",
				},
			},
		},
	},
};

export const AdaptiveCards = () => {
	const { message, action: onSendMessage, config } = useMessageContext();

	const getCardPayload = (message: IMessage) => {
		const _webchat = message?.data?._cognigy?._webchat?.adaptiveCard;
		const _defaultPreview = message?.data?._cognigy?._defaultPreview?.adaptiveCard;
		const _plugin = message?.data?._plugin?.payload;
		const defaultPreviewEnabled = config?.settings?.enableDefaultPreview;

		if (_webchat && _defaultPreview && !defaultPreviewEnabled) {
			return _webchat;
		}
		if (_defaultPreview && defaultPreviewEnabled) {
			return _defaultPreview;
		}
		return _plugin || _webchat;
	};

	const cardPayload = getCardPayload(message);

	const onExecuteAction = useCallback(
		action => {
			switch (action._propertyBag?.type) {
				case "Action.Submit": {
					onSendMessage?.("", {
						adaptivecards: action._processedData,
						request: { value: action._processedData },
					});

					return;
				}

				case "Action.OpenUrl": {
					const url = action._propertyBag?.url;
					window.open(url, "_blank");

					return;
				}
			}
		},
		[onSendMessage],
	);

	return (
		<ChatBubble
			className={classnames(styles["adaptivecard-wrapper"], "adaptivecard-wrapper internal")}
		>
			<AdaptiveCard
				payload={cardPayload}
				onExecuteAction={onExecuteAction}
				hostConfig={adaptiveCardsHostConfig}
			/>
		</ChatBubble>
	);
};
