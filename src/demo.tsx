import React from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "./Message.tsx";

const messages: MessageProps[] = [
	{
		message: {
			avatarNane: "Dognigy",
			text: "",
			data: {
				_cognigy: {
					_webchat: {
						message: {
							text: "This uses quick replies",
							quick_replies: [
								{
									content_type: "text",
									payload: "payload1",
									title: "Make purchase",
								},
								{
									content_type: "user_phone_number",
									image_url: "",
									image_alt_text: "",
									payload: "0111222333",
									title: "Call this number",
								},
							],
						},
					},
				},
			},
		},
	},
	{
		message: {
			avatarName: "Cognigy",
			data: {
				_cognigy: {
					_webchat: {
						message: {
							attachment: {
								type: "template",
								payload: {
									text: "Hello, Clara! You want to learn more about what we do at Cognigy? Let's have a chat!",
									template_type: "button",
									buttons: [
										{
											type: "postback",
											payload: "payload11",
											title: "Who are Cognigy",
											url: "",
										},
										{
											type: "postback",
											payload: "payload33",
											title: "I need technical support",
											url: "",
										},
										{
											type: "web_url",
											title: " View work item",
											url: "https://google.com",
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
	{
		message: {
			source: "bot",
			text: "Hello, how can I help you?",
			avatarName: "Cognigy",
		},
	},
	{
		message: {
			source: "user",
			text: "I have a problem with my order",
			avatarName: "Cognigy",
		},
	},
	{
		message: {
			source: "bot",
			text: "Here goes the text.\n\nThe text can also be multiline with <strong>HTML</strong> content",
			avatarName: "Cognigy",
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
