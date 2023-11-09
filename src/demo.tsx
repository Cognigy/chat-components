import React from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "./Message.tsx";
import { MessageSender } from "./messages/types.ts";

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
									url: "https://picsum.photos/500/500",
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
			text: null,
			data: {
				_cognigy: {
					_default: {
						_video: {
							type: "video",
							videoUrl:
								"http://s3.amazonaws.com/akamai.netstorage/HD_downloads/Orion_SM.mp4",
						},
					},
					_webchat: {
						message: {
							attachment: {
								type: "video",
								payload: {
									url: "https://youtu.be/4n__f0KfJF4?si=a5vwK93s9jrEWj-J",
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
			text: null,
			data: {
				_cognigy: {
					_default: {
						_audio: {
							type: "audio",
							audioUrl: "https://www.winhistory.de/more/winstart/mp3/winxp.mp3",
						},
					},
					_webchat: {
						message: {
							attachment: {
								type: "audio",
								payload: {
									url: "https://www.winhistory.de/more/winstart/mp3/winxp.mp3",
								},
							},
						},
					},
				},
			},
		},
	},
];

const action: MessageSender = payload => alert(JSON.stringify(payload, null, 2));

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		{messages.map((message, index) => (
			<Message key={index} {...message} action={action} />
		))}
	</React.StrictMode>,
);
