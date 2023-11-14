import { createContext } from "react";

export interface IImageContext {
	onExpand: () => void;
	onClose: () => void;
	url: string;
	altText?: string;
	isDownloadable: boolean;
}

export const ImageMessageContext = createContext<IImageContext | null>(null);
