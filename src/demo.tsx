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

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		{messages.map((message, index) => (
			<Message key={index} {...message} />
		))}
	</React.StrictMode>,
);
