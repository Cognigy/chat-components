import { useContext } from "react";
import { IMessangerImageContext, MessangerImageContext } from "./context";

export const useMessangerImageContext = () =>
	useContext(MessangerImageContext) as IMessangerImageContext;
