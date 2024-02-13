import { ChatEvent } from "src/index";
import { useMessageContext } from "../hooks";

import classes from "./XApp.module.css";

const XAppSubmitMessage = () => {
	const { message } = useMessageContext();

	const { success } = (message?.data as any)?._plugin?.data || {};
	const text = success ? "Submitted successfully" : "Submission failed";

	return <ChatEvent text={text} className={classes.pill} />;
};

export default XAppSubmitMessage;
