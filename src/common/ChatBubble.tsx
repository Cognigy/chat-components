import React, { FC } from "react";
import classes from "./ChatBubble.module.css";
import classnames from "classnames";

interface IChatBubbleProps {
    className?: string;
    children: React.ReactNode;
}

const ChatBubble: FC<IChatBubbleProps> = props => {
    const classNames = classnames(classes.bubble, props.className, "chat-bubble");
    
    return <div className={classNames}>{props.children}</div>;
};

export default ChatBubble;