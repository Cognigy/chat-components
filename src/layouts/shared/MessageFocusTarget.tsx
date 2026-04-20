import { FC } from "react";

import mainClasses from "src/main.module.css";

// Id prefix is load-bearing: `moveFocusToMessageFocusTarget` in src/utils.ts
// looks up `webchat-focus-target-${dataMessageId}`. Keep identical across layouts.
export const MessageFocusTarget: FC<{ dataMessageId?: string }> = ({ dataMessageId }) => (
	<div
		id={`webchat-focus-target-${dataMessageId}`}
		tabIndex={-1}
		className={mainClasses.srOnly}
		aria-hidden="true"
	/>
);
