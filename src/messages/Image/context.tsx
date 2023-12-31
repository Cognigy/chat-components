import { IWebchatButton } from "@cognigy/socket-client";
import { createContext } from "react";

export interface IImageContext {
	onExpand: () => void;
	onClose: () => void;
	url: string;
	altText?: string;
	button?: IWebchatButton;
	isDownloadable: boolean;
}

export const ImageMessageContext = createContext<IImageContext | null>(null);
