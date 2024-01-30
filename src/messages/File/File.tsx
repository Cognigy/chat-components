import { FC } from "react";
import classes from "./File.module.css";
import classnames from "classnames";
import { IUploadFileAttachmentData } from "@cognigy/socket-client";
import { useMessageContext } from "src/messages/hooks";
import { Typography } from "src/index";
import { Text } from "src/messages";
import { getFileExtension, getFileName } from "./helper";

const File: FC = () => {
	const { message } = useMessageContext();
	const attachments = message.data?.attachments as IUploadFileAttachmentData[];

	if (!attachments || attachments.length === 0) return null;

	return (
		<>
			{message.text && <Text content={message.text} />}
			<div className={classnames(classes.filesWrapper, "webchat-media-files-template-root")}>
				{attachments.map((attachment: IUploadFileAttachmentData, index: number) => {
					const { fileName, size, url } = attachment;

					return (
						<a href={url} target="_blank" style={{ textDecoration: "none" }}>
							<div
								className={classnames(
									classes.filePreview,
									"webchat-media-template-file",
								)}
								data-testid="file-message"
								key={index}
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
									{size > 1000000
										? `${(size / 1000000).toFixed(2)} MB`
										: `${(size / 1000).toFixed(2)} KB`}
								</Typography>
							</div>
						</a>
					);
				})}
			</div>
		</>
	);
};

export default File;
