import { FC } from "react";
import { MessagePasstroughProps } from "../types";


const Image: FC<MessagePasstroughProps> = props => {

    const { altText = "", url } = props?.message?.data?._cognigy?._webchat?.message?.attachment?.payload || {};

    if (url) return null
    return <img src={url} alt={altText}>TEST</img>;
};

export default Image;