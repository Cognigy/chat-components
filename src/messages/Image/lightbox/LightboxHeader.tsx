import { FC, KeyboardEvent, useRef } from "react";
import { useImageMessageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import { CloseIcon, DownloadIcon } from "src/assets/svg";

const LightboxHeader: FC = () => {
	const { url, altText, onClose } = useImageMessageContext();

	const firstButton = useRef<HTMLButtonElement>(null);

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

	return (
		<div className={classes.header}>
			<div className={classes.caption}>{altText}</div>
			<div className={classes.iconsGroup}>
				<button
					ref={firstButton}
					onClick={handleDownload}
					onKeyDown={handleKeyDownload}
					aria-label="Download fullsize image"
					className={classes.icon}
				>
					<DownloadIcon />
				</button>
				<button
					onClick={onClose}
					onKeyDown={handleKeyClose}
					aria-label="Close fullsize image modal"
					className={classes.icon}
				>
					<CloseIcon />
				</button>
			</div>
		</div>
	);
};

export default LightboxHeader;
