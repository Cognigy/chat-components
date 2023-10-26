import React from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "./Message.tsx";

const messages: MessageProps[] = [
	{
		source: "bot",
		message: {
			text: "Hello, how can I help you?",
		},
	},
	{
		source: "user",
		message: {
			text: "I have a problem with my order",
		},
	},
	{
		source: "bot",
		message: {
			text: "Sorry to here that. That sounds like a perfect time to test multiline message rendering, don't you think?",
		},
	},
];

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		{messages.map((message, index) => (
			<Message key={index} {...message} />
		))}
	</React.StrictMode>,
);
