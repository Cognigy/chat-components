import { ChatEvent } from "src/index";
import { useMessageContext } from "../hooks";

import type { IPluginXAppSubmit } from "@cognigy/socket-client/lib/interfaces/messageData";

import classes from "./XApp.module.css";

const XAppSubmitMessage = () => {
	const { message } = useMessageContext();

	const { success } = (message?.data?._plugin as IPluginXAppSubmit)?.data || {};
	const text = success ? "Submitted successfully" : "Submission failed";

	return <ChatEvent text={text} className={classes.pill} />;
};

export default XAppSubmitMessage;
