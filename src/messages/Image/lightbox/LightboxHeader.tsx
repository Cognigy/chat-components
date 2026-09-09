import { FC, KeyboardEvent, useEffect, useRef } from "react";
import { useImageMessageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import { CloseIcon, DownloadIcon } from "src/assets/svg";
import { useMessageContext } from "src/messages/hooks";

const LightboxHeader: FC = () => {
	const { url, altText, onClose } = useImageMessageContext();
	const { config } = useMessageContext();
	const firstButton = useRef<HTMLButtonElement>(null);
	const lastButton = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		setTimeout(() => {
			firstButton.current?.focus();
		}, 100);
	}, []);

	const handleDownload = () => {
		window.open(url, "_blank");
	};

	// The two header buttons are the dialog's only tab stops, so the focus
	// trap (APG modal dialog) is a two-way wrap between them: Shift+Tab from
	// the first (Download) lands on the last (Close), Tab from the last lands
	// on the first. Previously only the Tab-from-Close direction wrapped, so
	// Shift+Tab escaped into the page behind the lightbox (CGY-37634).
	const handleKeyDownload = (event: KeyboardEvent) => {
		if (event.key === "Tab" && event.shiftKey) {
			lastButton.current?.focus();
			event.preventDefault();
			return;
		}
		event.key === "Enter" && handleDownload();
	};

	const handleKeyClose = (event: KeyboardEvent) => {
		if (event.key === "Tab" && !event.shiftKey) {
			firstButton.current?.focus();
			event.preventDefault();
			return;
		}
		event.code === "Enter" && onClose && onClose();
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
					ref={firstButton}
					onClick={handleDownload}
					onKeyDown={handleKeyDownload}
					aria-label={downloadFullsizeImageLabel}
					className={classes.icon}
				>
					<DownloadIcon />
				</button>
				<button
					ref={lastButton}
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
