import { FC, useCallback, useEffect, useState } from "react";
import classnames from "classnames";

import { useMessageContext } from "src/messages/hooks";
import Typography from "src/common/Typography";
import { PrimaryButton } from "src/common/Buttons";

import { CloseIcon } from "src/assets/svg";
import classes from "./XApp.module.css";
import { IPluginXApp } from "@cognigy/socket-client/lib/interfaces/messageData";

const XApp: FC = () => {
	const { message, messageParams } = useMessageContext();

	const shouldOpenImmediately =
		!messageParams?.hasReply && (message?.data?._plugin as IPluginXApp)?.data?.immediateOpen;

	const [showOverlay, setShowOverlay] = useState(shouldOpenImmediately);

	const {
		sessionUrl,
		openButtonLabel = "Open",
		headerTitle = "Choose",
	} = (message?.data?._plugin as IPluginXApp)?.data || {};

	const handleSubmit = useCallback(
		(event: MessageEvent) => {
			if (sessionUrl.startsWith(event.origin) === false) {
				return;
			}

			if (event.data.type !== "x-app-submit") {
				return;
			}

			handleClose();
		},
		[sessionUrl],
	);

	useEffect(() => {
		function unsubscribe() {
			window.removeEventListener("message", handleSubmit);
		}

		if (showOverlay) {
			window.addEventListener("message", handleSubmit);
		} else {
			unsubscribe();
		}

		return () => {
			unsubscribe();
		};
	}, [handleSubmit, showOverlay]);

	if (!message?.data?._plugin || message.data._plugin.type !== "x-app") return;

	const handleOpen = () => {
		setShowOverlay(true);
	};

	const handleClose = () => {
		setShowOverlay(false);
	};

	return (
		<div data-testid="xApp-message">
			<PrimaryButton
				onClick={handleOpen}
				disabled={messageParams?.hasReply}
				data-testid="button-open"
			>
				{openButtonLabel}
			</PrimaryButton>
			{showOverlay && (
				<div
					className={classnames(classes.wrapper, "webchat-plugin")}
					tabIndex={0}
					role="dialog"
					aria-modal="true"
				>
					<div className={classnames(classes.header, "webchat-plugin-header")}>
						<Typography
							variant="h2-semibold"
							component="span"
							className={classnames(classes.title, "webchat-plugin-header-title")}
						>
							{headerTitle}
						</Typography>
						<button
							onClick={handleClose}
							aria-label="Close"
							className={classes.button}
							data-testid="button-close"
						>
							<CloseIcon />
						</button>
					</div>

					<div className={classnames(classes.content, "webchat-plugin-content")}>
						<iframe src={sessionUrl} className={classes.appFrame} />
					</div>
				</div>
			)}{" "}
		</div>
	);
};

export default XApp;
