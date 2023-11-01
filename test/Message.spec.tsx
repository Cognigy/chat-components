import { render, waitFor, screen } from "@testing-library/react";
import { it, describe, expect } from "vitest";
import Message from "../src/Message";

describe("Message", () => {
	it("renders text message", () => {
		const message = { text: "Hello World", source: "bot" };

		render(<Message message={message} />);
	});

	it("renders video message", async () => {
		const message = {
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
		};

		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(await screen.findByText('Attachment Video')).toBeInTheDocument();
	});

	it("renders audio message", async () => {
		const message = {
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
		};

		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(await screen.findByText('Attachment Audio')).toBeInTheDocument();
	});

	it("renders image message", async () => {
		const message = {
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
		};

		await waitFor(() => {
			render(<Message message={message} />);
		});

		expect(screen.getByAltText('Attachment Image')).toBeInTheDocument();
	});
});
