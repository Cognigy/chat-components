import { FC } from "react";
import classes from "./File.module.css";
import classnames from "classnames";
import { useMessageContext } from "src/messages/hooks";
import { Typography } from "src/index";
import { getFileExtension, getFileName } from "./helper";

export interface IUploadFileMetaData {
	runtimeFileId: string;
	fileName: string;
	status?: "infected" | "scanned";
	mimeType: string;
	size: number;
	url: string;
}

const File: FC = () => {
	const { message } = useMessageContext();
	// @ts-expect-error TODO:fix it in socket-client
	const attachments = message.data?.attachments as IUploadFileMetaData[];

	console.log("attachments", attachments);

	if (!attachments || attachments.length === 0) return null;

	return (
		<div className={classnames(classes.filesWrapper, "webchat-media-files-template-root")}>
			{attachments.map((attachment: IUploadFileMetaData, index: number) => {
				const { fileName, size } = attachment;

				return (
					<div
						className={classnames(classes.filePreview, "webchat-media-template-file")}
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
						<Typography component="span" variant="title2-regular">
							{size > 1000000
								? `${(size / 1000000).toFixed(2)} MB`
								: `${(size / 1000).toFixed(2)} KB`}
						</Typography>
					</div>
				);
			})}
		</div>
	);
};

export default File;
