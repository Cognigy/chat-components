import { MessageProps } from "../Message";

export type MessagePasstroughProps = Pick<MessageProps, "message" | "action" | "onEmitAnalytics" | "config">;
