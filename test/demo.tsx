import React, { FC, useState } from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "../src/messages/Message.tsx";
import { MessageSender } from "../src/messages/types.ts";

//fixtures
import listMessage from "test/fixtures/list.json";
import gallery from "test/fixtures/gallery.json";
import imageDownloadable from "test/fixtures/image-downloadable.json";
import image from "test/fixtures/image.json";
import imageBroken from "test/fixtures/imageBroken.json";
import video from "test/fixtures/video.json";
import videoYoutube from "test/fixtures/videoYoutube.json";
import audio from "test/fixtures/audio.json";
import file from "test/fixtures/file.json";
import AdaptiveCardPayloads from "test/fixtures/adaptiveCards.json";

import datePicker from "test/fixtures/datepicker/singleDate.json";
import datePickerMultiple from "test/fixtures/datepicker/multiple.json";
import datePickerRange from "test/fixtures/datepicker/range.json";
import datePickerWeeks from "test/fixtures/datepicker/weekNumbers.json";
import datePickerNoTime from "test/fixtures/datepicker/noTime.json";
import datePickerTimeonly from "test/fixtures/datepicker/timeOnly.json";
import datePickerDisableWeekends from "test/fixtures/datepicker/disableWeekends.json";

import { IMessage } from "@cognigy/socket-client";
import { ChatEvent, TypingIndicator, Typography } from "../src/index.ts";

const action: MessageSender = (text, data) =>
	alert("Text: " + JSON.stringify(text, null, 2) + " Data: " + JSON.stringify(data, null, 2));

type TScreen = {
	title: string;
	anchor: string;
	messages?: MessageProps[];
	content?: React.ReactNode[];
};

const screens: TScreen[] = [
	{
		title: "Adaptive Cards",
		anchor: "adaptive-cards",
		messages: [
			{
				message: {
					...(AdaptiveCardPayloads[0] as IMessage),
					timestamp: "1701163314138",
				},
			},
			{
				message: {
					...(AdaptiveCardPayloads[1] as IMessage),
					timestamp: "1701163314139",
				},
				prevMessage: {
					source: "bot",
					timestamp: "1701163314138",
				},
			},
			{
				message: {
					...(AdaptiveCardPayloads[2] as IMessage),
					timestamp: "1701163314139",
				},
				prevMessage: {
					source: "bot",
					timestamp: "1701163314138",
				},
			},
		],
	},
	{
		title: "Message Collation",
		anchor: "message-collation",
		messages: [
			{
				message: {
					text: "First message always has a header",
					source: "bot",
					timestamp: "1701163314138",
				},
			},
			{
				message: {
					text: "This message does not have a header",
					source: "bot",
					timestamp: "1701163319138",
				},
				prevMessage: {
					source: "bot",
					timestamp: "1701163314138",
				},
			},
		],
	},
	{
		title: "UI Components",
		anchor: "ui",
		messages: [
			{
				message: {
					text: "Hi, I need help with my order",
					source: "user",
					timestamp: "1701163314138",
				},
			},
			{
				message: { ...file, timestamp: "1701163314138", source: "user" } as IMessage,
				prevMessage: {
					source: "bot",
					timestamp: "1701163314138",
				},
			},
		],
		content: [<TypingIndicator />, <ChatEvent text="Conversation started" />],
	},
	{
		title: "Multimedia messages",
		anchor: "multimedia-messages",
		messages: [
			{ message: image as IMessage },
			{ message: imageDownloadable as IMessage },
			{
				message: {
					text: "Next one is a broken image",
					source: "bot",
					timestamp: "1701163314138",
				},
			},
			{
				message: { ...imageBroken, timestamp: "1701163314138", source: "bot" } as IMessage,
				prevMessage: {
					source: "bot",
					timestamp: "1701163314138",
				},
			},
			{ message: video as IMessage },
			{ message: videoYoutube as IMessage },
			{ message: audio as IMessage },
		],
	},
	{
		title: "List messages",
		anchor: "list-messages",
		messages: [{ message: listMessage as IMessage }],
	},
	{
		title: "Gallery",
		anchor: "gallery",
		messages: [{ message: gallery as IMessage }],
	},
	{
		title: "Datepicker",
		anchor: "datepicker",
		messages: [
			{ message: datePicker as IMessage },
			{ message: datePickerMultiple as IMessage },
			{ message: datePickerRange as IMessage },
			{ message: datePickerWeeks as IMessage },
			{ message: datePickerNoTime as IMessage },
			{ message: datePickerTimeonly as IMessage },
			{ message: datePickerDisableWeekends as IMessage },
		],
	},
	{
		title: "Quick Replies / Buttons",
		anchor: "quick-replies",
		messages: [
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
				hasReply: true,
				message: {
					avatarName: "Cognigy",
					text: "",
					source: "bot",
					data: {
						_cognigy: {
							_webchat: {
								message: {
									text: "This QR should be disabled.",
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
		],
	},
	{
		title: "Text messages",
		anchor: "text-messages",
		messages: [
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
		],
	},
];

interface MenuProps {
	currentScreen: string;
	setCurrentScreen: (anchor: string) => void;
}
export const Menu = (props: MenuProps) => {
	const { currentScreen, setCurrentScreen } = props;

	return (
		<>
			<nav>
				<ul>
					{screens.map(({ title, anchor }) => (
						<li key={anchor} className={anchor === currentScreen ? "current" : ""}>
							<a href={`#${anchor}`} onPointerDown={() => setCurrentScreen(anchor)}>
								{title}
							</a>
						</li>
					))}
				</ul>
			</nav>
			<div className="page-header">
				<Typography variant="h1-semibold">
					{screens.find(s => s.anchor === currentScreen)?.title}
				</Typography>
			</div>
		</>
	);
};

interface ScreenProps {
	messages: TScreen["messages"];
	content?: TScreen["content"];
}

const Screen: FC<ScreenProps> = props => {
	const { messages = [] } = props;

	return (
		<div className={"chatRoot"}>
			{messages.map((message, index) => (
				<Message key={index} {...message} action={action} />
			))}
			{props.content}
		</div>
	);
};

const Demo = () => {
	const [currentScreen, setCurrentScreen] = useState(() => {
		const CURRENT_PR = screens[0].anchor;

		const hash = window.location.hash.replace("#", "");

		return hash || CURRENT_PR;
	});

	const screen = screens.find(m => m.anchor === currentScreen);

	return (
		<section>
			<Menu currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
			<Screen messages={screen?.messages} content={screen?.content} />
		</section>
	);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Demo />
	</React.StrictMode>,
);
