import { useContext } from "react";
import { IImageContext, ImageMessageContext } from "./context";

export const useImageMessageContext = () => useContext(ImageMessageContext) as IImageContext;
