import { FC } from "react";
import { MessagePasstroughProps } from "../types";
import classes from "./TextWithButtons.module.css";

const TextWithButtons: FC<MessagePasstroughProps> = props => {
    const text = props.message.data._cognigy._webchat.message.attachment.payload.text;
    const buttons = props.message.data._cognigy._webchat.message.attachment.payload.buttons;

    const buttonElements = buttons.map((button: any) => {
        return <button className={classes.button} key={button.title} onClick={() => props.action?.("test")}>{button.title}</button>
    });

    return <><div className={classes.text} dangerouslySetInnerHTML={{ __html: text}} /><div className={classes.buttons}>{buttonElements}</div></> ;
}

export default TextWithButtons;