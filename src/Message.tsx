import { FC } from "react";
import classnames from "classnames";

import ChatBubble from "./common/ChatBubble";

import classes from "./Message.module.css"

type MessageSource = "agent" | "user" | "bot";

type MessageContent = {
  text: string;
};

export interface IMessageProps {
  className?: string;
  content: MessageContent;
  source: MessageSource;
}

const Message: FC<IMessageProps> = (props) => {
  const classNames = classnames("message", props.className, classes.message, props.source);

  const messageComponent = props.content?.text || null

  return (
    <div className={classNames}>
      <ChatBubble>{messageComponent}</ChatBubble>
    </div>
  );
};

export default Message;
