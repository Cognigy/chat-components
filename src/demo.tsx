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
					_webchat: {
						message: {
							attachment: {
								type: "template",
								payload: {
									text: "Text with buttons template. Here goes the text.\n\nThe text can also be multiline with <strong>HTML</strong> content",
									template_type: "button",
									buttons: [
										{
											type: "postback",
											payload: "foobar005b1pb",
											title: "foobar005b1",
											url: "",
											webview_height_ratio: "full",
											messenger_extensions: false,
										},
										{
											type: "web_url",
											title: "foobar005b2",
											url: "foobar005b1url1",
											messenger_extensions: false,
											webview_height_ratio: "full",
										},
										{
											type: "postback",
											payload: "",
											title: "foobar005b3",
											url: "",
											webview_height_ratio: "full",
											messenger_extensions: false,
										},
										{
											title: "foobar005b4",
											type: "phone_number",
											payload: "000111222",
										},
									],
								},
							},
						},
					},
				},
			},
		},
	},
];

const action = (payload: Record<string, unknown>) => alert(JSON.stringify(payload, null, 2));

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		{messages.map((message, index) => (
			<Message key={index} {...message} action={action} />
		))}
	</React.StrictMode>,
);
