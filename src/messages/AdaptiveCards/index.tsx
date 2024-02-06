import { useCallback } from "react";
import classnames from "classnames";

import AdaptiveCard from "./components/Adaptivecard";
import { useMessageContext } from "../hooks";
import styles from "./styles.module.css";

import type { IMessage } from "@cognigy/socket-client";
import ChatBubble from "src/common/ChatBubble";
import type { Action, HostConfig } from "adaptivecards";

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
			backgroundColor: "#fff",
			foregroundColors: {
				//@ts-ignore
				default: {
					default: "var(--black-10)",
					subtle: "var(--black-40)",
				},
			},
		},
	},
};

export const AdaptiveCards = () => {
	const { message, action: onSendMessage, config } = useMessageContext();

	const getCardPayload = (message: IMessage) => {
		//@ts-ignore
		const _webchat = message?.data?._cognigy?._webchat?.adaptiveCard;
		//@ts-ignore
		const _defaultPreview = message?.data?._cognigy?._defaultPreview?.adaptiveCard;
		//@ts-ignore
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
		(action: Action) => {
			//@ts-ignore
			switch (action._propertyBag?.type) {
				case "Action.Submit": {
					onSendMessage?.("", {
						//@ts-ignore
						adaptivecards: action._processedData,
						//@ts-ignore
						request: { value: action._processedData },
					});

					return;
				}

				case "Action.OpenUrl": {
					//@ts-ignore
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
