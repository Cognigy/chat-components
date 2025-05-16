import { IUploadFileAttachmentData } from "@cognigy/socket-client";
import { getSizeLabel, isImageAttachment } from "./File/helper";
import { IWebchatConfig } from "./types";
import { interpolateString } from "src/utils";

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
export const getLiveRegionContent = (
	messageType: MessageType,
	data: MessageData,
	config?: IWebchatConfig,
) => {
	switch (messageType) {
		case "text":
			return getTextContent(data as TTextData);

		case "textWithButtons":
			return getTextWithButtonsContent(data as TTextWithButtonsData, config);

		case "gallery":
			return getGalleryContent(data as TGalleryData, config);

		case "list":
			return getListContent(data as TListData, config);

		case "image":
			return getImageContent(data as TImageData, config);

		case "video":
			return getVideoContent(data as TVideoData, config);

		case "audio":
			return getAudioContent(data as TAudioData, config);

		case "file":
			return getFileContent(data as TFileData, config);

		case "event":
			return getEventContent(data as TEventData);

		default:
			return undefined;
	}
};

const getTextContent = (data: TTextData) => {
	return data.text || undefined;
};

const getTextWithButtonsContent = (data: TTextWithButtonsData, config?: IWebchatConfig) => {
	const { text, buttons } = data;
	const textWithButtonsAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.buttonGroupLabel ?? "Available actions:";
	if (text && buttons.length > 0) {
		return `${text}. ${textWithButtonsAriaLabel} ${formatListWithFullStop(buttons)}`;
	}

	return text || undefined;
};

const getGalleryContent = (data: TGalleryData, config?: IWebchatConfig) => {
	const { slides } = data;

	if (!slides || slides.length === 0) {
		return undefined;
	}
	const galleryContentAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.buttonGroupLabel ?? "Available actions:";

	if (slides.length === 1) {
		const { slideText, buttonLabels } = slides[0];
		const actionsText =
			buttonLabels && buttonLabels.length > 0
				? galleryContentAriaLabel + " " + formatListWithFullStop(buttonLabels)
				: undefined;

		return slideText && actionsText
			? `${slideText}. ${actionsText}`
			: slideText || actionsText || undefined;
	}

	const slidesCountText = interpolateString(
		config?.settings.customTranslations?.ariaLabels?.slidesCountText ?? `{slidesCount} slides.`,
		{
			slidesCount: slides.length.toString(),
		},
	);
	const slidesContentAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.slide ?? "Slide";
	const slidesContent = slides
		.map((slide, index) => {
			const { slideText, buttonLabels } = slide;
			const actionsText =
				buttonLabels && buttonLabels.length > 0
					? galleryContentAriaLabel + " " + formatListWithFullStop(buttonLabels)
					: undefined;

			return slideText && actionsText
				? `${slidesContentAriaLabel}: ${index + 1} :${slideText}. ${actionsText}`
				: slideText
					? `${slidesContentAriaLabel} ${index + 1}: ${slideText}`
					: undefined;
		})
		.filter(Boolean)
		.join(" ");

	return `${slidesCountText} ${slidesContent}`;
};

const getListContent = (data: TListData, config?: IWebchatConfig) => {
	const headerLabel = data[0];
	const items = Object.keys(data)
		.filter(key => key !== "0")
		.map(key => data[key]);

	const itemLabels = formatListWithFullStop(items);

	const listContentAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.listItemGroupLabel ??
		"Available list items:";
	if (headerLabel && itemLabels) {
		return `${headerLabel}. ${listContentAriaLabel} ${itemLabels}`;
	}
	if (itemLabels) {
		return `${listContentAriaLabel} ${itemLabels}`;
	}
	if (headerLabel) {
		return headerLabel;
	}
	return undefined;
};

const getImageContent = (data: TImageData, config?: IWebchatConfig) => {
	const { altText, isDownloadable } = data;
	const altTextLabel = altText ?? "";
	const dowloadableImageContentAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.imageContent?.downloadable ??
		"An image with download option.";
	const nonDownloadableImageContentAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.imageContent?.nonDownloadable ??
		"An image.";
	return (
		(isDownloadable ? dowloadableImageContentAriaLabel : nonDownloadableImageContentAriaLabel) +
		altTextLabel
	);
};

const getVideoContent = (data: TVideoData, config?: IWebchatConfig) => {
	const { hasTranscript, hasCaptions } = data;

	if (hasTranscript && hasCaptions) {
		return (
			config?.settings.customTranslations?.ariaLabels?.videoContent
				?.withTranscriptAndCaptions ?? "A video with transcript and captions."
		);
	}
	if (hasTranscript) {
		return (
			config?.settings.customTranslations?.ariaLabels?.videoContent?.withTranscript ??
			"A video with transcript."
		);
	}
	if (hasCaptions) {
		return (
			config?.settings.customTranslations?.ariaLabels?.videoContent?.withCaptions ??
			"A video with captions."
		);
	}
	return (
		config?.settings.customTranslations?.ariaLabels?.videoContent
			?.withoutTranscriptAndCaptions ?? "A video message."
	);
};

const getAudioContent = (data: TAudioData, config?: IWebchatConfig) => {
	if (data.hasTranscript) {
		return (
			config?.settings.customTranslations?.ariaLabels?.audioContent?.withTranscript ??
			"An audio message with transcript"
		);
	}
	return (
		config?.settings.customTranslations?.ariaLabels?.audioContent?.withoutTranscript ??
		"An audio message."
	);
};

const getFileContent = (data: TFileData, config?: IWebchatConfig) => {
	const { text, attachments } = data;
	const singleFileContentAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.fileContent?.singleFile ??
		"A {type} named '{fileName}' with size {sizeLabel}.";
	const multipleFilesContentAriaLabel =
		config?.settings.customTranslations?.ariaLabels?.fileContent?.multipleFiles ??
		"File {index}: '{fileName}', size {sizeLabel}.";
	if (attachments.length === 1) {
		const { fileName, size, mimeType } = attachments[0];
		const sizeLabel = getSizeLabel(size);
		const type = isImageAttachment(mimeType) ? "image" : "file";
		return (
			`${text}.` +
			interpolateString(singleFileContentAriaLabel, {
				type,
				fileName,
				sizeLabel,
			})
		);
	}

	return `${text}. ${attachments.length} files. ${attachments
		.map((attachment, index) =>
			interpolateString(multipleFilesContentAriaLabel, {
				index: `${index + 1}`,
				fileName: attachment.fileName,
				sizeLabel: getSizeLabel(attachment.size),
			}),
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
