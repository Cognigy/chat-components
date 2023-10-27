import { MessageProps } from "../Message";
import type { IOutput } from "@cognigy/socket-client";

export type TMessage = {
  source: "user" | "bot" | "engagement" | "agent",
 } & IOutput;

export type MessagePasstroughProps = Pick<MessageProps, "message" | "action" | "onEmitAnalytics" | "config">;
