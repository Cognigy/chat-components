import { FC, useEffect } from "react";
import { useImageMessageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import LightboxHeader from "./LightboxHeader";

const Lightbox: FC = () => {
	const { url, altText, onClose } = useImageMessageContext();

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

	return (
		<div role="dialog" aria-label="Lightbox" className={classes.wrapper}>
			<div className={classes.content} onClick={handleOnClickBackdrop}>
				<img
					className={classes.fullImage}
					data-test="image-lightbox"
					alt={altText || "Attachment Full"}
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
