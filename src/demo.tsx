import React from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "./messages/Message.tsx";
import { MessageSender } from "./messages/types.ts";

//fixtures
import listMessage from "test/fixtures/list.json";
import gallery from "test/fixtures/gallery.json";
import image from "test/fixtures/image.json";
import imageDownloadable from "test/fixtures/image-downloadable.json";
import video from "test/fixtures/video.json";
import videoYoutube from "test/fixtures/videoYoutube.json";
import audio from "test/fixtures/audio.json";

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
									title: "Call us",
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
											title: "Tech support",
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
			source: "bot",
			text: "This messaged is with previous with disableHeader prop",
			avatarName: "Cognigy",
		},
		disableHeader: true,
	},
	{
		message: image,
	},
	{
		message: imageDownloadable,
	},
	{
		message: video,
	},
	{
		message: videoYoutube,
	},
	{
		message: audio,
	},
	{
		message: listMessage,
	},
	{
		message: gallery,
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
