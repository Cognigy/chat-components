import { sanitizeContent } from "src/sanitize";
import { getWebchatButtonLabel } from "src/utils";

/**
 * Get text and buttons in the message, to be used during live region announcement.
 * @param content - The data containing text and buttons.
 * @param isSanitizeEnabled - Whether to sanitize HTML content.
 * @returns An array of objects containing slide text and button labels.
 */
export const getTextWithButtonsContent = (
	content: { text: string; buttons: [] },
	isSanitizeEnabled: boolean,
): any => {
	const { text, buttons } = content;
	const textContent = sanitizeContent(text, isSanitizeEnabled);

	const buttonLabels =
		buttons?.map(button => {
			const buttonLabel = getWebchatButtonLabel(button);
			const sanitizedButtonLabel = sanitizeContent(buttonLabel, isSanitizeEnabled);

			return sanitizedButtonLabel;
		}) || [];

	return { textContent, buttonLabels };
};
