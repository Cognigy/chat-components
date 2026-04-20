// Compile-time contract for the Message layout discriminated union.
// `tsc --noEmit` enforces these — if the union is weakened, these lines
// will stop producing errors and TS will flag the now-unused @ts-expect-error.

import Message from "../../src/messages/Message";
import type { IMessage } from "@cognigy/socket-client";

const msg = { text: "x", source: "bot" } as IMessage;

// Valid: webchat by default, no c26-only props.
export const ok1 = <Message message={msg} />;

// Valid: explicit webchat.
export const ok2 = <Message message={msg} layout="webchat" />;

// Valid: c26 with both optional slot props.
export const ok3 = <Message message={msg} layout="c26" label={{ text: "AI" }} avatar={null} />;

// Valid: c26 with neither slot.
export const ok4 = <Message message={msg} layout="c26" />;

// @ts-expect-error — `label` requires `layout="c26"`.
export const bad1 = <Message message={msg} label={{ text: "bad" }} />;

// @ts-expect-error — `avatar` requires `layout="c26"`.
export const bad2 = <Message message={msg} avatar={null} />;

// @ts-expect-error — `label` is not allowed on explicit webchat branch.
export const bad3 = <Message message={msg} layout="webchat" label={{ text: "bad" }} />;

// @ts-expect-error — `avatar` is not allowed on explicit webchat branch.
export const bad4 = <Message message={msg} layout="webchat" avatar={null} />;
