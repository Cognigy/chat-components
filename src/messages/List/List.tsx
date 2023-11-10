import { FC, Fragment, useEffect, useMemo } from "react";
import ListMain from "./ListMain";
import { useMessageContext } from "src/hooks";
import ListRegular from "./ListRegular";
import mainclasses from "src/main.module.css";
import classes from "./List.module.css";
import { SingleButton } from "src/common/ActionButtons";
import { getChannelPayload } from "src/utils";

const List: FC = () => {
	const { message, config, action } = useMessageContext();
	const payload = getChannelPayload(message, config);

	const { elements, top_element_style, buttons } = payload.message.attachment.payload;

	// We support the "large" string to maintain compatibility with old format
	const showTopElementLarge = top_element_style === "large" || top_element_style === true;

	const regularElements = showTopElementLarge ? elements.slice(1) : elements;
	const headerElement = showTopElementLarge ? elements[0] : null;
	const button = buttons && buttons[0];
	const listTemplateId = useMemo(() => `webchatListTemplateRoot-${Date.now()}`, []);

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

	return (
		<div className={classes.wrapper} role="list" id={listTemplateId}>
			{headerElement && <ListMain element={headerElement} />}
			{regularElements.map((element: any, index: number) => (
				<Fragment key={index}>
					{index > 0 && <div className={mainclasses.divider} />}
					<ListRegular element={element} />
					{button && index === regularElements.length - 1 && (
						<div className={mainclasses.divider} />
					)}
				</Fragment>
			))}
			{button && (
				<SingleButton
					type="primary"
					action={action}
					button={button}
					containerClassName={classes.mainButtonWrapper}
				/>
			)}
		</div>
	);
};

export default List;