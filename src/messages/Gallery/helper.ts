import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { sanitizeHTML } from "src/sanitize";
import { getWebchatButtonLabel } from "src/utils";

export interface GalleryLiveContent {
	slideText: string;
	buttonLabels: string[];
}

/**
 * Get text and buttons in a gallery, to be used during live region announcement.
 * @param elements - The gallery elements to process.
 * @param isSanitizeEnabled - Whether to sanitize HTML content.
 * @returns An array of objects containing slide text and button labels.
 */
export const getGalleryContent = (
	elements: IWebchatAttachmentElement[] | undefined,
	isSanitizeEnabled: boolean,
): GalleryLiveContent[] => {
	if (!elements || elements.length === 0) {
		return [];
	}

	return elements.map((element: IWebchatAttachmentElement) => {
		const title = sanitizeContent(element.title, isSanitizeEnabled);

		const subtitle = sanitizeContent(element.subtitle, isSanitizeEnabled);

		const buttonLabels = (element.buttons || []).map(button =>
			sanitizeContent(getWebchatButtonLabel(button), isSanitizeEnabled),
		);

		const slideText = `${title}. ${subtitle}.`;

		return {
			slideText,
			buttonLabels,
		};
	});
};

/**
 * Sanitizes content if sanitization is enabled.
 * @param content - The content to sanitize.
 * @param isSanitizeEnabled - Whether to sanitize the content.
 * @returns The sanitized or raw content.
 */
const sanitizeContent = (content: string | undefined, isSanitizeEnabled: boolean): string => {
	if (!content) {
		return "";
	}
	return isSanitizeEnabled ? sanitizeHTML(content) : content;
};
