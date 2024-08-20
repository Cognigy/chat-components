import { FC, useEffect } from "react";
import { useMessageContext, useRandomId } from "src/messages/hooks";
import classes from "./Gallery.module.css";
import classnames from "classnames";
import { getChannelPayload } from "src/utils";
import { ArrowBack as ArrowNavIcon } from "src/assets/svg";
import { Navigation, Pagination, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import GalleryItem from "./GalleryItem";
import { IWebchatAttachmentElement, IWebchatTemplateAttachment } from "@cognigy/socket-client";

const Gallery: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { elements } =
		(payload?.message?.attachment as IWebchatTemplateAttachment)?.payload || {};

	const carouselContentId = useRandomId("webchatCarouselContentButton");

	useEffect(() => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		const firstCardContent = document.getElementById(`${carouselContentId}-0`);
		const firstButton = firstCardContent?.getElementsByTagName("button")?.[0];

		if (!config?.settings?.widgetSettings?.enableAutoFocus) return;

		if (!chatHistory?.contains(document.activeElement)) return;

		if (firstCardContent?.getAttribute("role") === "link") {
			setTimeout(() => {
				firstCardContent?.focus();
			}, 200);
		} else if (firstButton) {
			setTimeout(() => {
				firstButton?.focus();
			}, 200);
		}
	}, [carouselContentId, config?.settings?.widgetSettings?.enableAutoFocus]);

	if (!elements || elements?.length === 0) return null;

	if (elements.length === 1)
		return (
			<div
				className={classnames("webchat-carousel-template-root", classes.wrapper)}
				data-testid="gallery-message"
			>
				<GalleryItem slide={elements[0]} contentId={`${carouselContentId}-0`} />
			</div>
		);

	return (
		<Swiper
			modules={[Navigation, Pagination, A11y]}
			spaceBetween={8}
			slidesPerView="auto"
			navigation={{ prevEl: ".gallery-button-prev", nextEl: ".gallery-button-next" }}
			pagination={{ clickable: true }}
			className={classnames("webchat-carousel-template-root", classes.wrapper)}
			data-testid="gallery-message"
			a11y={{ slideLabelMessage: `Slide {{index}} of {{slidesLength}}` }}
		>
			{elements.map((element: IWebchatAttachmentElement, i: number) => (
				<SwiperSlide key={i} style={{ width: "206px" }}>
					<GalleryItem slide={element} contentId={`${carouselContentId}-${i}`} />
				</SwiperSlide>
			))}

			<button className="gallery-button-prev">
				<ArrowNavIcon />
			</button>
			<button className="gallery-button-next">
				<ArrowNavIcon />
			</button>
		</Swiper>
	);
};

export default Gallery;
