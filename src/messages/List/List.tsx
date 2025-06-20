import { FC, Fragment, useCallback, useEffect, useState } from "react";
import ListItem from "./ListItem";
import { useLiveRegion, useMessageContext, useRandomId } from "src/messages/hooks";
import mainclasses from "src/main.module.css";
import classes from "./List.module.css";
import classnames from "classnames";
import { PrimaryButton } from "src/common/Buttons";
import { getChannelPayload } from "src/utils";
import { IWebchatAttachmentElement, IWebchatTemplateAttachment } from "@cognigy/socket-client";

const List: FC = () => {
	const {
		message,
		messageParams,
		config,
		"data-message-id": dataMessageId,
		action,
		onEmitAnalytics,
	} = useMessageContext();
	const payload = getChannelPayload(message, config);

	const [listItemLiveRegionLabels, setListItemLiveRegionLabels] = useState<
		Record<number, string>
	>({});

	const { elements, top_element_style, buttons } =
		(payload?.message?.attachment as IWebchatTemplateAttachment)?.payload || {};

	const showTopElementLarge = top_element_style === "large" || top_element_style === true;

	const regularElements = showTopElementLarge ? elements?.slice(1) : elements;
	const headerElement = showTopElementLarge ? elements?.[0] : null;
	const button = buttons && buttons?.[0];

	const listTemplateId = useRandomId("webchatListTemplateRoot");

	const shouldBeDisabled = messageParams?.isConversationEnded;

	useEffect(() => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		if (!config?.settings?.widgetSettings?.enableAutoFocus) return;

		if (!chatHistory?.contains(document.activeElement)) return;

		const listTemplateRoot = document.getElementById(listTemplateId);
		// get the first focusable element within the list and add focus
		const focusable = listTemplateRoot?.querySelectorAll(
			'button, [href], [tabindex]:not([tabindex="-1"])',
		);
		const firstFocusable = focusable && (focusable[0] as HTMLElement);
		setTimeout(() => {
			firstFocusable?.focus();
		}, 200);
	}, [config?.settings?.widgetSettings?.enableAutoFocus, listTemplateId]);

	useLiveRegion({
		messageType: "list",
		data: listItemLiveRegionLabels,
		validation: () => elements?.length === Object.keys(listItemLiveRegionLabels).length,
	});

	const handleListItemLiveRegionLabel = useCallback((index: number, label: string) => {
		setListItemLiveRegionLabels(prev => {
			if (prev[index] === label) return prev;
			return { ...prev, [index]: label };
		});
	}, []);

	if (!elements || elements?.length === 0) return null;

	return (
		<div
			className={classnames("webchat-list-template-root", classes.wrapper)}
			id={listTemplateId}
			data-testid="list-message"
		>
			{headerElement && (
				<ListItem
					element={headerElement}
					isHeaderElement
					headingLevel="h4"
					id={`header-${listTemplateId}`}
					onSetScreenReaderLabel={(text: string) => {
						handleListItemLiveRegionLabel(0, text);
					}}
				/>
			)}
			<ul
				aria-labelledby={headerElement ? `listHeader-header-${listTemplateId}` : undefined}
				className={classes.list}
			>
				{regularElements &&
					regularElements.map((element: IWebchatAttachmentElement, index: number) => (
						<Fragment key={index}>
							{index > 0 && <div className={mainclasses.divider} />}
							<ListItem
								element={element}
								headingLevel={headerElement ? "h5" : "h4"}
								id={`${listTemplateId}-${index}`}
								onSetScreenReaderLabel={(text: string) => {
									handleListItemLiveRegionLabel(index + 1, text);
								}}
							/>
							{button && index === regularElements.length - 1 && (
								<div className={mainclasses.divider} />
							)}
						</Fragment>
					))}
			</ul>
			{button && (
				<PrimaryButton
					isActionButton
					dataMessageId={dataMessageId}
					action={shouldBeDisabled ? undefined : action}
					button={button}
					buttonClassName="webchat-list-template-global-button"
					containerClassName={classes.mainButtonWrapper}
					config={config}
					onEmitAnalytics={onEmitAnalytics}
				/>
			)}
		</div>
	);
};

export default List;
