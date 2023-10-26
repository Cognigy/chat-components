import React from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "./Message.tsx";

const messages: MessageProps[] = [
	{
    message: {
      source: "bot",
			text: "Hello, how can I help you?",
		},
	},
	{
    message: {
      source: "user",
			text: "I have a problem with my order",
		},
	},
	{
    message: {
      source: "bot",
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
