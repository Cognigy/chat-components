const ONE_MB = 1000000;
const ONE_KB = 1000;

export const getFileName = (fileNameWithExtension: string) => {
	const splitName = fileNameWithExtension.split(".");
	if (splitName.length > 1) {
		return `${splitName.slice(0, -1).join(".")}.`;
	} else {
		// return full name here if it didn't have a file ending
		return fileNameWithExtension;
	}
};

export const getFileExtension = (fileNameWithExtension: string) => {
	const splitName = fileNameWithExtension.split(".");
	if (splitName.length > 1) {
		return splitName.pop();
	} else {
		return null;
	}
};

export const getSizeLabel = (size: number) => {
	if (size > ONE_MB) {
		return `${(size / ONE_MB).toFixed(2)} MB`;
	}

	return `${(size / ONE_KB).toFixed(2)} KB`;
};

// The mime types we accept for image operations
export const VALID_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const isImageAttachment = (mimeType: string): boolean => {
	return VALID_IMAGE_MIME_TYPES.includes(mimeType);
};
