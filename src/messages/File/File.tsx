import { FC } from "react";
import classes from "./File.module.css";
import classnames from "classnames";
import { IUploadFileAttachmentData } from "@cognigy/socket-client";
import { useLiveRegion, useMessageContext } from "src/messages/hooks";
import { Typography } from "src/index";
import { Text } from "src/messages";
import { getFileExtension, getFileName, getSizeLabel, isImageAttachment } from "./helper";

const File: FC = props => {
	const { message } = useMessageContext();
	const attachments = message.data?.attachments as IUploadFileAttachmentData[];
	const text = message.text;

	useLiveRegion({
		messageType: "file",
		data: { text: text ?? "", attachments: attachments ?? [] },
		validation: () => !!attachments && attachments.length > 0,
	});

	if (!attachments || attachments.length === 0) return null;

	// sort attachments by file type, valid images first
	const images: IUploadFileAttachmentData[] = [];
	const nonImages: IUploadFileAttachmentData[] = [];

	attachments.forEach(attachment => {
		if (isImageAttachment(attachment.mimeType)) {
			images.push(attachment);
		} else {
			nonImages.push(attachment);
		}
	});

	return (
		<>
			<div className={classnames(classes.filesWrapper, "webchat-media-files-template-root")}>
				{images.length > 0 && (
					<div
						className={classnames(
							classes.filePreviewContainer,
							"webchat-media-template-image-container",
						)}
					>
						{images.map((attachment: IUploadFileAttachmentData, index: number) => {
							const { fileName, size, url } = attachment;

							return (
								<a
									href={url}
									target="_blank"
									style={{ textDecoration: "none" }}
									key={index}
								>
									<img
										src={url}
										alt={`${fileName} (${getSizeLabel(size)})`}
										className={classnames(
											attachments.length > 1
												? classes.smallImagePrevew
												: classes.imagePreview,
											"webchat-media-template-image",
										)}
										data-testid="image-message"
										title={`${fileName} (${getSizeLabel(size)})`}
									/>
								</a>
							);
						})}
					</div>
				)}

				{nonImages.length > 0 && (
					<div
						className={classnames(
							classes.filePreviewContainer,
							"webchat-media-template-files-container",
						)}
					>
						{nonImages.map((attachment: IUploadFileAttachmentData, index: number) => {
							const { fileName, size, url } = attachment;

							return (
								<a
									href={url}
									target="_blank"
									style={{ textDecoration: "none" }}
									key={index}
								>
									<div
										className={classnames(
											classes.filePreview,
											"webchat-media-template-file",
										)}
										data-testid="file-message"
									>
										<div className={classes.fileNameWrapper}>
											<Typography
												component="span"
												variant="title2-regular"
												className={classes.fileName}
											>
												{getFileName(fileName)}
											</Typography>
											<Typography
												component="span"
												variant="title2-regular"
												className={classes.fileExtension}
											>
												{getFileExtension(fileName)}
											</Typography>
										</div>
										<Typography
											component="span"
											variant="title2-regular"
											className={classes.fileSize}
										>
											{getSizeLabel(size)}
										</Typography>
									</div>
								</a>
							);
						})}
					</div>
				)}
			</div>
			{text && <Text {...props} content={text} ignoreLiveRegion />}
		</>
	);
};

export default File;
