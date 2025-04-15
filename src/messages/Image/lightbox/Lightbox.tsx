import { FC, useEffect } from "react";
import { useImageMessageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import LightboxHeader from "./LightboxHeader";
import { useMessageContext } from "src/messages/hooks";

const Lightbox: FC = () => {
	const { url, altText, onClose } = useImageMessageContext();
	const { config } = useMessageContext();
	useEffect(() => {
		const close = (event: KeyboardEvent) => {
			event.code === "Escape" && onClose && onClose();
		};
		window.addEventListener("keydown", close);
		return () => window.removeEventListener("keydown", close);
	}, [onClose]);

	const handleOnClickBackdrop = (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		onClose();
	};

	const handleOnClickImage = (event: React.MouseEvent<HTMLElement>) => {
		event.stopPropagation();
	};

	const handleOnSwipeImage = (event: React.TouchEvent<HTMLElement>) => {
		event.preventDefault();
		onClose();
	};
	const lightboxLabel =
		config?.settings.customTranslations?.ariaLabels?.fullSizeImageViewerTitle || "Full-size image viewer";

	return (
		<div role="dialog" aria-label={lightboxLabel} className={classes.wrapper}>
			<div className={classes.content} onClick={handleOnClickBackdrop}>
				<img
					className={classes.fullImage}
					data-test="image-lightbox"
					alt={altText}
					src={url}
					onClick={handleOnClickImage}
					onTouchMove={handleOnSwipeImage}
				/>
			</div>
			<LightboxHeader />
			<div />
		</div>
	);
};

export default Lightbox;
