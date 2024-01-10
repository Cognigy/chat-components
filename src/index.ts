import { match } from "./matcher";
import ActionButtons from "./common/ActionButtons/ActionButtons";
import PrimaryButton from "./common/Buttons/PrimaryButton";
import SecondaryButton from "./common/Buttons/SecondaryButton";
import Message, { MessageProps } from "./messages/Message";
import TypingIndicator from "./common/TypingIndicator";
import Typography, { TypographyProps } from "./common/Typography/Typography";
import ChatEvent, { ChatEventProps } from "./common/ChatEvent";

import "@fontsource/figtree/400.css";
import "@fontsource/figtree/400-italic.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/500-italic.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/600-italic.css";
import "@fontsource/figtree/700.css";
import "@fontsource/figtree/700-italic.css";

export {
	Message,
	match,
	ActionButtons,
	TypingIndicator,
	Typography,
	ChatEvent,
	PrimaryButton,
	SecondaryButton,
};

export type { MessageProps, TypographyProps, ChatEventProps };
