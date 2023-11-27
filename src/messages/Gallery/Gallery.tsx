import { FC, useEffect, useMemo } from "react";
import { useMessageContext } from "src/messages/hooks";
import classes from "./Gallery.module.css";
import classnames from "classnames";
import { getChannelPayload, getRandomId } from "src/utils";
import { ArrowBack as ArrowNavIcon } from "src/assets/svg";
import { Navigation, Pagination, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import GalleryItem from "./GalleryItem";
import { IWebchatAttachmentElement } from "@cognigy/socket-client/lib/interfaces/messageData";

const Gallery: FC = () => {
	const { message, config } = useMessageContext();
	const payload = getChannelPayload(message, config);
	const { elements } = payload.message.attachment?.payload || {};

	const carouselContentId = useMemo(() => getRandomId("webchatCarouselContentButton"), []);

	useEffect(() => {
		const chatHistory = document.getElementById("webchatChatHistoryWrapperLiveLogPanel");

		const firstCardContent = document.getElementById(`${carouselContentId}-0`);
		const firstButton = firstCardContent?.getElementsByTagName("button")?.[0];

		if (!config?.settings.enableAutoFocus) return;

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
	}, [carouselContentId, config?.settings.enableAutoFocus]);

	if (!elements || elements.length === 0) return null;

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
		>
			{elements.map((element: IWebchatAttachmentElement, i: number) => (
				<SwiperSlide key={i} style={{ width: "206px" }}>
					<GalleryItem slide={element} contentId={`${carouselContentId}-${i}`} />
				</SwiperSlide>
			))}

			<span className="gallery-button-prev">
				<ArrowNavIcon />
			</span>
			<span className="gallery-button-next">
				<ArrowNavIcon />
			</span>
		</Swiper>
	);
};

export default Gallery;
