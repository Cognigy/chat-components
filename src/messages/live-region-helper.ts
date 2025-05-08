import { IUploadFileAttachmentData } from "@cognigy/socket-client";
import { getSizeLabel, isImageAttachment } from "./File/helper";

export type MessageType =
	| "list"
	| "textWithButtons"
	| "text"
	| "gallery"
	| "image"
	| "video"
	| "audio"
	| "file"
	| "event"
	| "custom";

type TTextData = { text: string };
type TTextWithButtonsData = { text: string; buttons: string[] };
type TGalleryData = { slides: { slideText?: string; buttonLabels?: string[] }[] };
type TListData = { [key: string]: string };
type TImageData = { altText: string; isDownloadable: boolean };
type TVideoData = { hasTranscript: boolean; hasCaptions: boolean };
type TAudioData = { hasTranscript: boolean };
type TFileData = { text: string; attachments: IUploadFileAttachmentData[] };
type TEventData = { dataMessageId: string };

type MessageData =
	| TTextData
	| TTextWithButtonsData
	| TGalleryData
	| TListData
	| TImageData
	| TVideoData
	| TAudioData
	| TFileData
	| TEventData;

/**
 * Computes the live region text based on the message type and provided data.
 * @param messageType The type of the message.
 * @param data The data required to compute the live region text.
 * @returns The computed live region text.
 */
export const getLiveRegionContent = (messageType: MessageType, data: MessageData) => {
	switch (messageType) {
		case "text":
			return getTextContent(data as TTextData);

		case "textWithButtons":
			return getTextWithButtonsContent(data as TTextWithButtonsData);

		case "gallery":
			return getGalleryContent(data as TGalleryData);

		case "list":
			return getListContent(data as TListData);

		case "image":
			return getImageContent(data as TImageData);

		case "video":
			return getVideoContent(data as TVideoData);

		case "audio":
			return getAudioContent(data as TAudioData);

		case "file":
			return getFileContent(data as TFileData);

		case "event":
			return getEventContent(data as TEventData);

		default:
			return undefined;
	}
};

const getTextContent = (data: TTextData) => {
	return data.text || undefined;
};

const getTextWithButtonsContent = (data: TTextWithButtonsData) => {
	const { text, buttons } = data;

	if (text && buttons.length > 0) {
		return `${text}. Available options: ${formatListWithFullStop(buttons)}`;
	}

	return text || undefined;
};

const getGalleryContent = (data: TGalleryData) => {
	const { slides } = data;

	if (!slides || slides.length === 0) {
		return undefined;
	}

	if (slides.length === 1) {
		const { slideText, buttonLabels } = slides[0];
		const actionsText =
			buttonLabels && buttonLabels.length > 0
				? `Available actions: ${formatListWithFullStop(buttonLabels)}`
				: undefined;

		return slideText && actionsText
			? `${slideText}. ${actionsText}`
			: slideText || actionsText || undefined;
	}

	const slidesCountText = `${slides.length} slides.`;
	const slidesContent = slides
		.map((slide, index) => {
			const { slideText, buttonLabels } = slide;
			const actionsText =
				buttonLabels && buttonLabels.length > 0
					? `Available actions: ${formatListWithFullStop(buttonLabels)}`
					: undefined;

			return slideText && actionsText
				? `Slide ${index + 1}: ${slideText}. ${actionsText}`
				: slideText
					? `Slide ${index + 1}: ${slideText}`
					: undefined;
		})
		.filter(Boolean)
		.join(" ");

	return `${slidesCountText} ${slidesContent}`;
};

const getListContent = (data: TListData) => {
	const headerLabel = data[0];
	const items = Object.keys(data)
		.filter(key => key !== "0")
		.map(key => data[key]);

	const itemLabels = formatListWithFullStop(items);

	if (headerLabel && itemLabels) {
		return `${headerLabel}. Available list items: ${itemLabels}`;
	}
	if (itemLabels) {
		return `Available list items: ${itemLabels}`;
	}
	if (headerLabel) {
		return headerLabel;
	}
	return undefined;
};

const getImageContent = (data: TImageData) => {
	const { altText, isDownloadable } = data;
	const altTextLabel = altText ?? "";

	return isDownloadable
		? `An image with download option. ${altTextLabel}`
		: `An image. ${altTextLabel}`;
};

const getVideoContent = (data: TVideoData) => {
	const { hasTranscript, hasCaptions } = data;

	if (hasTranscript && hasCaptions) {
		return "A video with transcript and captions.";
	}
	if (hasTranscript) {
		return "A video with transcript.";
	}
	if (hasCaptions) {
		return "A video with captions.";
	}
	return "A video message.";
};

const getAudioContent = (data: TAudioData) => {
	return data.hasTranscript ? "An audio message with transcript." : "An audio message.";
};

const getFileContent = (data: TFileData) => {
	const { text, attachments } = data;

	if (attachments.length === 1) {
		const { fileName, size, mimeType } = attachments[0];
		const sizeLabel = getSizeLabel(size);
		const type = isImageAttachment(mimeType) ? "image" : "file";
		return `${text}. A ${type} named '${fileName}' with size ${sizeLabel}.`;
	}

	return `${text}. ${attachments.length} files. ${attachments
		.map(
			(attachment, index) =>
				`File ${index + 1}: '${attachment.fileName}', size ${getSizeLabel(attachment.size)}.`,
		)
		.join(" ")}`;
};

const getEventContent = (data: TEventData) => {
	// Event status pills are ignored from the live region announcement as they have their own aria-live="assertive" attribute.
	// Webchat will check for the IGNORE- prefix in the liveContent and will skip announcement.
	return data.dataMessageId ? `IGNORE-${data.dataMessageId}` : undefined;
};

/**
 * Formats a list of strings by joining them with commas and adding a full stop to the last item.
 * @param items The list of strings to format.
 * @returns A formatted string with a full stop at the end.
 */
const formatListWithFullStop = (items: string[]): string => {
	if (!items || items.length === 0) {
		return "";
	}

	if (items.length === 1) {
		return `${items[0]}.`;
	}

	const allButLast = items.slice(0, -1).join(", ");
	const lastItem = items[items.length - 1];
	return `${allButLast}, ${lastItem}.`;
};
