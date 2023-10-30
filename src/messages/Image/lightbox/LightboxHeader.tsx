import { KeyboardEvent, useRef } from "react";
import { useMessangerImageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import ReactLogo from "../../../assets/svg/baseline-close-24px.svg?react";
import downloadSrc from '../../../assets/svg/baseline-download-24px.svg';

const LightboxHeader = () => {
    const { url, altText, onClose } = useMessangerImageContext();

	const firstButton = useRef<HTMLImageElement>(null);

	const handleDownload = () => {
		window.open(url, "_blank");
	};

	const handleKeyDownload = (event: KeyboardEvent<HTMLImageElement>) => {
		event.key === "Enter" && handleDownload();
	};

	const handleKeyClose = (event: KeyboardEvent<HTMLImageElement>) => {
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
                <div
                    ref={firstButton}
                    onClick={handleDownload}
                    onKeyDown={handleKeyDownload}
                    aria-label="Download fullsize image"
                    className={classes.icon}
                >
                    <img src={downloadSrc} />
                </div>
                <div
                    onClick={onClose}
                    onKeyDown={handleKeyClose}
                    aria-label="Close fullsize image modal"
                    className={classes.icon}
                >
                    <ReactLogo />
                </div>
            </div>
        </div>
	);
};

export default LightboxHeader;
