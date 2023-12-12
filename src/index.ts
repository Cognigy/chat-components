import { match } from "./matcher";
import ActionButtons from "./common/ActionButtons/ActionButtons";
import Message, { MessageProps } from "./messages/Message";
import TypingIndicator from "./common/TypingIndicator";
import Typography, { TypographyProps } from "./common/Typography/Typography";

import "@fontsource/figtree/400.css";
import "@fontsource/figtree/400-italic.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/500-italic.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/600-italic.css";
import "@fontsource/figtree/700.css";
import "@fontsource/figtree/700-italic.css";

export { Message, match, ActionButtons, TypingIndicator, Typography };

export type { MessageProps, TypographyProps };
