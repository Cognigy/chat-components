import { FC, useEffect, useRef } from "react";
import { useImageMessageContext } from "../hooks";
import classes from "./Lightbox.module.css";
import LightboxHeader from "./LightboxHeader";
import { useMessageContext } from "src/messages/hooks";
import { getFocusableElements } from "src/utils";

const Lightbox: FC = () => {
	const { url, altText, onClose } = useImageMessageContext();
	const { config } = useMessageContext();
	const dialogRef = useRef<HTMLDivElement>(null);

	// Window-level keyboard handling for the modal (APG modal dialog pattern):
	// Escape closes; Tab / Shift+Tab cycle through the dialog's focusable
	// elements and never leave it. The trap lives on the window rather than on
	// the buttons or the dialog element so it also covers focus resting on
	// nothing: clicking the full-size image moves focus to <body>, and since
	// the dialog is rendered inline in the message, an untrapped Tab from
	// there lands in the page behind the lightbox.
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" || event.code === "Escape") {
				onClose && onClose();
				return;
			}
			if (event.key !== "Tab" || !dialogRef.current) return;

			const { firstFocusable, lastFocusable } = getFocusableElements(dialogRef.current);
			if (!firstFocusable || !lastFocusable) return;

			const active = document.activeElement;
			const focusInsideDialog = !!active && dialogRef.current.contains(active);

			if (!focusInsideDialog) {
				event.preventDefault();
				(event.shiftKey ? lastFocusable : firstFocusable).focus();
			} else if (event.shiftKey && active === firstFocusable) {
				event.preventDefault();
				lastFocusable.focus();
			} else if (!event.shiftKey && active === lastFocusable) {
				event.preventDefault();
				firstFocusable.focus();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
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
		config?.settings.customTranslations?.ariaLabels?.fullSizeImageViewerTitle ||
		"Full-size image viewer";

	return (
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-label={lightboxLabel}
			className={classes.wrapper}
		>
			{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-to-close
			    backdrop is a pointer convenience; the keyboard path exists: the window-level
			    Escape listener above closes the dialog and LightboxHeader renders a focusable
			    close button. */}
			<div className={classes.content} onClick={handleOnClickBackdrop}>
				{/* `alt` must always be present: React drops the attribute for
				    undefined, which axe flags as image-alt (WCAG 1.1.1). With no
				    alt text the image is marked decorative — the dialog itself is
				    already named via aria-label — mirroring ImageThumb (CGY-37634). */}
				{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- the image's
				    click handler only stops propagation so clicking the image itself doesn't
				    trigger the backdrop close — it adds no interaction of its own. */}
				<img
					className={classes.fullImage}
					data-test="image-lightbox"
					alt={altText || ""}
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
