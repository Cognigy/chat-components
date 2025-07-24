import { sanitizeContent } from "src/sanitize";
import { getWebchatButtonLabel } from "src/utils";

/**
 * Get text and buttons in the message, to be used during live region announcement.
 * @param content - The data containing text and buttons.
 * @param isSanitizeEnabled - Whether to sanitize HTML content.
 * @param customAllowedHtmlTags - Custom HTML tags allowed for sanitization.
 * @returns An array of objects containing slide text and button labels.
 */
export const getTextWithButtonsContent = (
	content: { text: string; buttons: [] },
	isSanitizeEnabled: boolean,
	customAllowedHtmlTags: string[] | undefined,
): any => {
	const { text, buttons } = content;
	const textContent = sanitizeContent(text, isSanitizeEnabled, customAllowedHtmlTags);

	const buttonLabels =
		buttons?.map(button => {
			const buttonLabel = getWebchatButtonLabel(button);
			const sanitizedButtonLabel = sanitizeContent(
				buttonLabel,
				isSanitizeEnabled,
				customAllowedHtmlTags,
			);

			return sanitizedButtonLabel;
		}) || [];

	return { textContent, buttonLabels };
};
