// @ts-nocheck
import React, { Dispatch, FC, SetStateAction, useState } from "react";
import ReactDOM from "react-dom/client";

import "./demo.css";
import Message, { MessageProps } from "../src/messages/Message.tsx";
import { IWebchatConfig, MessageSender } from "../src/messages/types.ts";

//fixtures
import listMessage from "test/fixtures/list.json";
import gallery from "test/fixtures/gallery.json";
import imageDownloadable from "test/fixtures/image-downloadable.json";
import image from "test/fixtures/image.json";
import imageBroken from "test/fixtures/imageBroken.json";
import video from "test/fixtures/video.json";
import videoYoutube from "test/fixtures/videoYoutube.json";
import videoAltText from "test/fixtures/videoWithAltText.json";
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
import { MessageProviderProps } from "src/messages/context.tsx";

const action: MessageSender = (text, data) =>
	alert("Text: " + JSON.stringify(text, null, 2) + " Data: " + JSON.stringify(data, null, 2));

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type TScreen = {
	title: string;
	anchor: string;
	messages?: Array<Omit<MessageProps, "config"> & { config?: DeepPartial<IWebchatConfig> }>;
	content?: React.ReactNode[];
};

const screens: TScreen[] = [
	{
		title: "Default Preview",
		anchor: "default-preview",
		messages: [
			{
				message: {
					data: {
						_cognigy: {
							_defaultPreview: {
								message: {
									text: "RENDER OK",
									quick_replies: [
										{
											id: 0.44535334241574,
											content_type: "postback",
											payload: "foobar003pb01",
											title: "foobar003qr01",
										},
									],
								},
							},
							_webchat: { message: { text: "RENDER WRONG" } },
						},
					},
				},
				config: {
					settings: {
						widgetSettings: {
							enableDefaultPreview: true,
						},
					},
				},
			},
			{
				message: {
					data: {
						_cognigy: {
							_webchat: {
								message: {
									text: "RENDER WRONG",
								},
							},
							_defaultPreview: {
								message: {
									text: "RENDER OK",
								},
							},
						},
					},
				},
				config: {
					settings: {
						widgetSettings: {
							enableDefaultPreview: true,
						},
					},
				},
			},
		],
	},
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
			{
				message: {
					text: "This message has a new a header",
					source: "agent",
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
			{ message: videoAltText as IMessage },
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
				message: {
					avatarName: "Cognigy",
					text: "",
					source: "bot",
					data: {
						_cognigy: {
							_webchat: {
								message: {
									text: "",
									quick_replies: [
										{
											content_type: "text",
											payload: "payload1",
											title: "This QR does not have a text bubble above",
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
					source: "agent",
					text: "This is an agent message",
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
					source: "agent",
					text: "Avatar url and name overrides",
					data: {
						//@ts-ignore
						_webchat: {
							agentAvatarOverrideUrlOnce: "https://placewaifu.com/image/200/200",
							agentAvatarOverrideNameOnce: "Agent Name Override",
						},
					},
				},
			},
			{
				message: {
					source: "bot",
					text: "This message should not overflow and should get hard breaks: https://static.test?token=d4567f11cffa23a49b2190355b956da8de46fcbc7817d3ce3708d6bddabc0bfd",
				},
			},
			{
				message: {
					source: "bot",
					text: 'This message has both anchor and image tags <a href="https://docs.cognigy.com">Cognigy Docs</a> <img src="https://placewaifu.com/image/200/200" alt="Alt text">',
				},
			},
			{
				message: {
					source: "bot",
					text: 'Large Image: <img src="https://www.cognigy.com/hs-fs/hubfs/AI%20agent%20business.png?width=1153&height=1024&name=AI%20agent%20business.png" alt="Alt text">',
				},
			},
			{
				// Number 0 as a text should be rendered as a text message
				message: {
					source: "bot",
					text: 0,
				},
			},
			{
				// Data-only message should not render anything
				message: {
					source: "bot",
					text: "",
					data: {
						_test: {
							aaa: "bbb",
						},
					},
				},
			},
		],
	},
	{
		title: "Streaming messages",
		anchor: "streaming-messages",
		messages: [
			{
				message: {
					source: "user",
					text: "I want to cook an omelette",
				},
			},
			{
				message: {
					source: "bot",
					text: [
						"For a delicious cheese, meat, and veggie omelette, here is a simple recipe idea:",
						"### Ingredients:",
						"- 3 large eggs",
						"- 1/4 cup of shredded cheese (such as cheddar or mozzarella)",
						"- 1/4 cup of cooked ham or bacon, chopped",
						"- 1/4 cup of mixed vegetables (like bell peppers, onions, and mushrooms), diced",
						"- Salt and pepper to taste",
						"- 1 tablespoon of butter or oil for cooking",
						"### Instructions:",
						"1. **Prepare the Ingredients**: Ensure the meat is cooked and vegetables are chopped.",
						"2. **Beat the Eggs**: In a bowl, beat the eggs with a pinch of salt and pepper.",
						"3. **Cook the Vegetables**: In a non-stick skillet, heat the butter or oil over medium heat.",
						"Add the vegetables and sauté until they are soft.",
						"4. **Add the Eggs**: Pour the beaten eggs into the skillet, making sure they cover the vegetables evenly.",
						"5. **Add Cheese and Meat**: As the eggs begin to set, sprinkle the cheese and meat over one half of the omelette.",
						"6. **Fold and Serve**: Once the omelette is mostly set, use a spatula to fold it in half.",
						"Cook for another minute, then slide it onto a plate.",
						"Would you like to know any variations or tips for cooking the omelette?",
					]
				},
			},
			{
				message: {
					source: "user",
					text: "thanks!",
				},
			},
			{
				message: {
					text: "You're welcome!",
					data: {
						_cognigy: {
							_messageId: "71e92048-c930-415d-82e1-1bbc21105e5d",
						},
					},
					source: "bot",
					timestamp: "1701163314138",
				},
			},
			{
				message: {
					text: "If you have any more questions or need further assistance, feel free to ask.",
					data: {
						_cognigy: {
							_messageId: "71e92048-c930-415d-82e1-1bbc21105e5d",
						},
					},
					source: "bot",
					timestamp: "1701163319138",
				},
				prevMessage: {
					source: "bot",
					timestamp: "1701163314138",
				},
			},
			{
				message: {
					text: "Enjoy your omelette!",
					data: {
						_cognigy: {
							_messageId: "a860b998-25f9-4c73-92db-5955ca2f8ef3",
						},
					},
					source: "bot",
				},
			},
		],
	},
	{
		title: "xApp Buttons",
		anchor: "xapp-buttons",
		messages: [
			{
				message: {
					data: {
						_cognigy: {
							_default: {
								_quickReplies: {
									type: "quick_replies",
									quickReplies: [
										{
											id: 0.4782026154264929,
											title: "Enter my SUPER secret",
											imageAltText: "",
											imageUrl: "",
											contentType: "openXApp",
											payload:
												"https://static.test?token=002f31acb7588108fc605ccc001763733ef4ce34c9f87360c1cab889467d69ab",
										},
									],
									text: "Now, please open the SUPER secret form manually",
								},
							},
							_webchat: {
								message: {
									text: "QR",
									quick_replies: [
										{
											content_type: "openXApp",
											image_url: "",
											image_alt_text: "",
											payload:
												"https://static.test?token=002f31acb7588108fc605ccc001763733ef4ce34c9f87360c1cab889467d69ab",
											title: "Enter my SUPER secret",
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
					data: {
						_cognigy: {
							_webchat: {
								message: {
									attachment: {
										type: "template",
										payload: {
											text: "Button",
											template_type: "button",
											buttons: [
												{
													title: "Open XApp Button",
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													type: "openXApp" as any,
													payload:
														"https://static.test?token=3c7feaf07c76d49699eaa0073d0afcdafd48dba2aa7a4dfc7acb18d0057c29c0",
												},
											],
										},
									},
								},
							},
						},
					},
					source: "bot",
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

interface MessageParamsProps {
	messageParams: MessageProviderProps["messageParams"];
	setMessageParams: Dispatch<SetStateAction<{ hasReply: boolean; isConversationEnded: boolean }>>;
}
const MessageParams = (props: MessageParamsProps) => {
	const { setMessageParams, messageParams } = props;

	const toggleConversationEnded = () => {
		setMessageParams(prev => ({ ...prev, isConversationEnded: !prev.isConversationEnded }));
	};

	const toggleHasReply = () => {
		setMessageParams(prev => ({ ...prev, hasReply: !prev.hasReply }));
	};

	return (
		<div className="message-params">
			<label className="switch">
				<p>hasReply</p>
				<input
					type="checkbox"
					checked={!!messageParams?.hasReply}
					onChange={toggleHasReply}
				/>
				<span className="slider" />
			</label>
			<label className="switch">
				<p>isConversationEnded</p>
				<input
					type="checkbox"
					checked={!!messageParams?.isConversationEnded}
					onChange={toggleConversationEnded}
				/>
				<span className="slider" />
			</label>
		</div>
	);
};

interface ScreenProps {
	messages: TScreen["messages"];
	content?: TScreen["content"];
}

const Screen: FC<ScreenProps> = props => {
	const { messages = [] } = props;

	const [messageParams, setMessageParams] = useState({
		hasReply: false,
		isConversationEnded: false,
	});

	return (
		<div id="content">
			<div className={"chatRoot"}>
				{messages.map((message, index) => (
					<Message
						key={index}
						{...message}
						action={action}
						hasReply={messageParams?.hasReply}
						isConversationEnded={messageParams?.isConversationEnded}
						openXAppOverlay={url => alert(`Open XApp Overlay, url is: ${url}`)}
					/>
				))}
				{props.content}
			</div>
			<MessageParams messageParams={messageParams} setMessageParams={setMessageParams} />
		</div>
	);
};

const Demo = () => {
	const [currentScreen, setCurrentScreen] = useState(() => {
		const CURRENT_PR = screens[9].anchor;

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
