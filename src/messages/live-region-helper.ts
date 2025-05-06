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

/**
 * Computes the live region text based on the message type and provided data.
 * @param messageType The type of the message.
 * @param data The data required to compute the live region text.
 * @returns The computed live region text.
 */
export const getLiveRegionContent = (messageType: MessageType, data: any): string | undefined => {
	switch (messageType) {
		case "text":
			return getTextContent(data);

		case "textWithButtons":
			return getTextWithButtonsContent(data);

		case "gallery":
			return getGalleryContent(data);

		case "list":
			return getListContent(data);

		case "image":
			return getImageContent(data);

		case "video":
			return getVideoContent(data);

		case "audio":
			return getAudioContent(data);

		case "file":
			return getFileContent(data);

		case "event":
			return getEventContent(data);

		default:
			return undefined;
	}
};

const getTextContent = (data: { text: string }): string | undefined => {
	return data.text || undefined;
};

const getTextWithButtonsContent = (data: {
	text: string;
	buttons: string[];
}): string | undefined => {
	const { text, buttons } = data;

	if (text && buttons.length > 0) {
		return `${text}. Available options: ${buttons.join(", ")}`;
	}

	return text || undefined;
};

const getGalleryContent = (data: { slides: any[] }): string | undefined => {
	const { slides } = data;

	if (!slides || slides.length === 0) {
		return undefined;
	}

	if (slides.length === 1) {
		const { slideText, buttonLabels } = slides[0];
		const actionsText =
			buttonLabels && buttonLabels.length > 0
				? `Available actions: ${buttonLabels.join(", ")}`
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
					? `Available actions: ${buttonLabels.join(", ")}`
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

const getListContent = (data: any): string | undefined => {
	const headerLabel = data[0];
	const itemLabels = Object.keys(data)
		.filter(key => key !== "0")
		.map(key => data[key])
		.join(", ");

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

const getImageContent = (data: {
	altText: string;
	isDownloadable: boolean;
}): string | undefined => {
	const { altText, isDownloadable } = data;
	const altTextLabel = altText ?? "";

	return isDownloadable
		? `An image with download option. ${altTextLabel}`
		: `An image. ${altTextLabel}`;
};

const getVideoContent = (data: {
	hasTranscript: boolean;
	hasCaptions: boolean;
}): string | undefined => {
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

const getAudioContent = (data: { hasTranscript: boolean }): string | undefined => {
	return data.hasTranscript ? "An audio message with transcript." : "An audio message.";
};

const getFileContent = (data: { attachments: IUploadFileAttachmentData[] }): string | undefined => {
	const { attachments } = data;

	if (attachments.length === 1) {
		const { fileName, size, mimeType } = attachments[0];
		const sizeLabel = getSizeLabel(size);
		const type = isImageAttachment(mimeType) ? "image" : "file";
		return `A ${type} named '${fileName}' with size ${sizeLabel}.`;
	}

	return `${attachments.length} files. ${attachments
		.map(
			(attachment, index) =>
				`File ${index + 1}: '${attachment.fileName}', size ${getSizeLabel(attachment.size)}.`,
		)
		.join(" ")}`;
};

const getEventContent = (data: { dataMessageId: string }): string | undefined => {
	// Event status pills are ignored from the live region announcement as they have their own aria-live="assertive" attribute.
	// Webchat will check for the IGNORE- prefix in the liveContent and will skip announcement.
	return data.dataMessageId ? `IGNORE-${data.dataMessageId}` : undefined;
};
