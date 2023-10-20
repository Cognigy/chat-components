import React, { FC } from "react";
import classes from "./ChatBubble.module.css";

interface IChatBubbleProps {
    children: React.ReactNode;
}

const ChatBubble: FC<IChatBubbleProps> = props => {
    
    return <div className={classes.bubble}>{props.children}</div>;
};

export default ChatBubble;