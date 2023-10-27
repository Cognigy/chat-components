import { FC } from "react";
import { MessagePasstroughProps } from "../types";

const TextWithButtons: FC<MessagePasstroughProps> = props => {
    const text = props.message.data._cognigy._webchat.message.attachment.payload.text;
    const buttons = props.message.data._cognigy._webchat.message.attachment.payload.buttons;

    const buttonElements = buttons.map((button: any) => {
        return <button key={button.title} onClick={() => props.action?.("test")}>{button.title}</button>
    });

    return <><div>{text}</div><div>{buttonElements}</div></> ;
}

export default TextWithButtons;