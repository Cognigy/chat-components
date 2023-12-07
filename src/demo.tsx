import React from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "./messages/Message.tsx";
import { MessageSender } from "./messages/types.ts";

//fixtures
import listMessage from "test/fixtures/list.json";
import gallery from "test/fixtures/gallery.json";
import imageDownloadable from "test/fixtures/image-downloadable.json";
import image from "test/fixtures/image.json";
import imageBroken from "test/fixtures/imageBroken.json";
import video from "test/fixtures/video.json";
import videoYoutube from "test/fixtures/videoYoutube.json";
import audio from "test/fixtures/audio.json";
import { IMessage } from "@cognigy/socket-client";
import { TypingIndicator } from "./index.ts";

const messages: MessageProps[] = [
	{
		message: {
			text: "First message",
			source: "bot",
			timestamp: "1701163314138",
		},
	},
	{
		message: {
			text: "Second message",
			source: "bot",
			timestamp: "1701163319138",
		},
		prevMessage: {
			text: "Firts message",
			source: "bot",
			timestamp: "1701163314138",
		},
	},
	{
		message: {
			avatarName: "Cognigy",
			text: "",
			source: "bot",
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
			source: "bot",

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
		message: image as IMessage,
	},
	{
		message: {
			source: "bot",
			text: "The following is a broken Image",
			avatarName: "Cognigy",
		},
	},
	{
		message: imageBroken as IMessage,
	},
	{
		message: imageDownloadable as IMessage,
	},
	{
		message: video as IMessage,
	},
	{
		message: videoYoutube as IMessage,
	},
	{
		message: audio as IMessage,
	},
	{
		message: listMessage as IMessage,
	},
	{
		message: gallery as IMessage,
	},
];

const action: MessageSender = payload => alert(JSON.stringify(payload, null, 2));

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<TypingIndicator />
		{messages.map((message, index) => (
			<Message key={index} {...message} action={action} />
		))}
	</React.StrictMode>,
);
