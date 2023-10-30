import { KeyboardEvent, useRef } from "react";
import { useMessangerImageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import { CloseIcon, DownloadIcon } from "src/assets/svg";

const LightboxHeader = () => {
	const { url, altText, onClose } = useMessangerImageContext();

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
					onKeyDown={(e) => handleKeyDownload(e)}
					aria-label="Download fullsize image"
					className={classes.icon}
				>
					<DownloadIcon />
				</button>
				<button
					onClick={onClose}
					onKeyDown={(e) => handleKeyClose(e)}
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
