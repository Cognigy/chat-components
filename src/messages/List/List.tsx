import { FC, useEffect, useMemo } from "react";
import { MessagePasstroughProps } from "../types";

const List: FC<MessagePasstroughProps> = props => {
	const { payload } = props?.message?.data?._cognigy?._webchat?.message?.attachment || {};

	const { elements, top_element_style, buttons } = payload;

	// We support the "large" string to maintain compatibility with old format
    const showTopElementLarge = top_element_style === "large" || top_element_style === true;
    
	const regularElements = showTopElementLarge ? elements.slice(1) : elements;
	const headerElement = showTopElementLarge ? elements[0] : null;
	const button = buttons && buttons[0];
	const listTemplateId = useMemo(() => `webchatListTemplateRoot-${Date.now()}`, []);

    console.log('regularElements', regularElements);
    console.log('headerElement', headerElement);
    console.log('button', button);

	useEffect(() => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		// if (!config?.settings.enableAutoFocus) return;

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
	}, [listTemplateId]);

	return (
		<div className="webchat-list-template-root" role="list" id={listTemplateId}>
			List
		</div>
	);
};

export default List;
