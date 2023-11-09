import { createContext } from "react";
import { IMessageImage } from "../types";

export interface IImageContext extends IMessageImage {
	onExpand: () => void;
	onClose: () => void;
}

export const ImageMessageContext = createContext<IImageContext | null>(null);
