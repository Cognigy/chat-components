import { FC, KeyboardEvent, useEffect, useRef } from "react";
import { useImageMessageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import { CloseIcon, DownloadIcon } from "src/assets/svg";
import { useMessageContext } from "src/messages/hooks";

const LightboxHeader: FC = () => {
	const { url, altText, onClose } = useImageMessageContext();
	const { config } = useMessageContext();
	const firstButton = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		setTimeout(() => {
			firstButton.current?.focus();
		}, 100);
	}, []);

	const handleDownload = () => {
		window.open(url, "_blank");
	};

	const handleKeyDownload = (event: KeyboardEvent) => {
		event.key === "Enter" && handleDownload();
	};

	const handleKeyClose = (event: KeyboardEvent) => {
		if (event.key === "Tab" || event.shiftKey) {
			firstButton.current?.focus();
			event.preventDefault();
		}
		event.code === "Enter" && onClose && onClose();
	};

	const downloadFullsizeImageLabel =
		config?.settings.customTranslations?.ariaLabels?.downloadFullsizeImage ||
		"Download fullsize image";
	const closeFullsizeImageModalLabel =
		config?.settings.customTranslations?.ariaLabels?.closeFullsizeImageModal ||
		"Close fullsize image modal";
	return (
		<div className={classes.header}>
			<div className={classes.caption}>{altText}</div>
			<div className={classes.iconsGroup}>
				<button
					ref={firstButton}
					onClick={handleDownload}
					onKeyDown={handleKeyDownload}
					aria-label={downloadFullsizeImageLabel}
					className={classes.icon}
				>
					<DownloadIcon />
				</button>
				<button
					onClick={onClose}
					onKeyDown={handleKeyClose}
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
