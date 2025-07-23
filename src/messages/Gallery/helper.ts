import { IWebchatAttachmentElement } from "@cognigy/socket-client";
import { sanitizeContent } from "src/sanitize";
import { getWebchatButtonLabel } from "src/utils";

export interface GalleryLiveContent {
	slideText: string;
	buttonLabels: string[] | undefined;
}

/**
 * Get text and buttons in a gallery, to be used during live region announcement.
 * @param elements - The gallery elements to process.
 * @param isSanitizeEnabled - Whether to sanitize HTML content.
 * @param customAllowedHtmlTags - Custom HTML tags allowed for sanitization.
 * @returns An array of objects containing slide text and button labels.
 */
export const getGalleryContent = (
	elements: IWebchatAttachmentElement[] | undefined,
	isSanitizeEnabled: boolean,
	customAllowedHtmlTags: string[] = [],
): GalleryLiveContent[] => {
	if (!elements || elements.length === 0) {
		return [];
	}

	return elements.map((element: IWebchatAttachmentElement) => {
		const title = sanitizeContent(element.title, isSanitizeEnabled, customAllowedHtmlTags);

		const subtitle = sanitizeContent(
			element.subtitle,
			isSanitizeEnabled,
			customAllowedHtmlTags,
		);

		const buttonLabels = (element.buttons || []).map(button =>
			sanitizeContent(
				getWebchatButtonLabel(button),
				isSanitizeEnabled,
				customAllowedHtmlTags,
			),
		);

		const slideText = `${title}. ${subtitle}`;

		return {
			slideText,
			buttonLabels,
		};
	});
};
