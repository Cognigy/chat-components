import { FC, Fragment, useEffect, useMemo } from "react";
import ListItem from "./ListItem";
import { useMessageContext } from "src/messages/hooks";
import mainclasses from "src/main.module.css";
import classes from "./List.module.css";
import classnames from "classnames";
import { PrimaryButton } from "src/common/Buttons";
import { getChannelPayload, getRandomId } from "src/utils";
import { IWebchatAttachmentElement, IWebchatTemplateAttachment } from "@cognigy/socket-client";

const List: FC = () => {
	const { message, config, action, onEmitAnalytics } = useMessageContext();
	const payload = getChannelPayload(message, config);

	const { elements, top_element_style, buttons } =
		(payload?.message?.attachment as IWebchatTemplateAttachment)?.payload || {};

	// We support the "large" string to maintain compatibility with old format
	const showTopElementLarge = top_element_style === "large" || top_element_style === true;

	const regularElements = showTopElementLarge ? elements?.slice(1) : elements;
	const headerElement = showTopElementLarge ? elements?.[0] : null;
	const button = buttons && buttons?.[0];
	const listTemplateId = useMemo(() => getRandomId("webchatListTemplateRoot"), []);

	useEffect(() => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		if (!config?.settings.enableAutoFocus) return;

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
	}, [config?.settings.enableAutoFocus, listTemplateId]);

	if (!elements || elements?.length === 0) return null;

	return (
		<div
			className={classnames("webchat-list-template-root", classes.wrapper)}
			role="list"
			id={listTemplateId}
			data-testid="list-message"
		>
			{headerElement && <ListItem element={headerElement} isHeaderElement />}
			{regularElements &&
				regularElements.map((element: IWebchatAttachmentElement, index: number) => (
					<Fragment key={index}>
						{index > 0 && <div className={mainclasses.divider} />}
						<ListItem element={element} />
						{button && index === regularElements.length - 1 && (
							<div className={mainclasses.divider} />
						)}
					</Fragment>
				))}
			{button && (
				<PrimaryButton
					isActionButton
					action={action}
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
