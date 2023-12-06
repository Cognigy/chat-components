import "@fontsource/figtree/400.css";
import "@fontsource/figtree/400-italic.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/500-italic.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/600-italic.css";
import "@fontsource/figtree/700.css";
import "@fontsource/figtree/700-italic.css";

import Message, { MessageProps } from "./messages/Message";
import { match } from "./matcher";
import Typography from "./common/Typography/Typography";
import TypingIndicator from "./common/TypingIndicator";

export { Message, match, TypingIndicator };
export type { MessageProps };
export { Typography };
