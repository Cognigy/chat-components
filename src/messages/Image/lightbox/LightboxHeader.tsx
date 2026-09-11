import { FC, useEffect, useRef } from "react";
import { useImageMessageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import { CloseIcon, DownloadIcon } from "src/assets/svg";
import { useMessageContext } from "src/messages/hooks";

const LightboxHeader: FC = () => {
	const { url, altText, onClose } = useImageMessageContext();
	const { config } = useMessageContext();
	const downloadButton = useRef<HTMLButtonElement>(null);

	// Focus moves into the dialog on open (APG modal dialog). The focus trap
	// itself lives in Lightbox.tsx at window level, so these are plain native
	// buttons: Enter/Space activation is the browser's synthesized click. A
	// keydown handler that also calls the action fires it twice on Enter
	// (keydown plus the click), i.e. two download tabs.
	useEffect(() => {
		setTimeout(() => {
			downloadButton.current?.focus();
		}, 100);
	}, []);

	const handleDownload = () => {
		window.open(url, "_blank");
	};

	const downloadFullsizeImageLabel =
		config?.settings.customTranslations?.ariaLabels?.downloadFullsizeImage ||
		"Download full-size image";
	const closeFullsizeImageModalLabel =
		config?.settings.customTranslations?.ariaLabels?.closeFullsizeImageModal ||
		"Close full-size image viewer";

	return (
		<div className={classes.header}>
			<div className={classes.caption}>{altText}</div>
			<div className={classes.iconsGroup}>
				<button
					ref={downloadButton}
					onClick={handleDownload}
					aria-label={downloadFullsizeImageLabel}
					className={classes.icon}
				>
					<DownloadIcon />
				</button>
				<button
					onClick={onClose}
					aria-label={closeFullsizeImageModalLabel}
					className={classes.icon}
				>
					<CloseIcon />
				</button>
			</div>
		</div>
	);
};

export default LightboxHeader;
