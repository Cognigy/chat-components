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
	{
		message: {
			text: null,
			data: {
				_cognigy: {
					_default: {
						_image: {
							type: "image",
							imageUrl: "https://placekitten.com/300/300",
						},
					},
					_webchat: {
						message: {
							attachment: {
								type: "image",
								payload: {
									url: "https://placekitten.com/300/300",
								},
							},
						},
					},
				},
			},
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
