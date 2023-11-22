import { FC, useEffect, useMemo } from "react";
import { useMessageContext } from "src/messages/hooks";
import classes from "./Gallery.module.css";
import classnames from "classnames";
import { getChannelPayload, getRandomId } from "src/utils";
import { ArrowBack } from "src/assets/svg";

import { Navigation, Pagination, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import GalleryItem from "./GalleryItem";

import "./swiper.css";
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

            if(!chatHistory?.contains(document.activeElement)) return;

            if(firstCardContent?.getAttribute("role") === "link") {
                setTimeout(() => {
                    firstCardContent?.focus();
                }, 200);
            } else if(firstButton) {
                setTimeout(() => {
                    firstButton?.focus();
                }, 200);
            }    
	}, []);

	if (elements.length === 0) return null;

	return (
		<Swiper
			modules={[Navigation, Pagination, A11y]}
			spaceBetween={8}
			slidesPerView="auto"
			navigation={{ prevEl: ".gallery-button-prev", nextEl: ".gallery-button-next" }}
			pagination={{ clickable: true }}
			className={classnames("webchat-carousel-template-root", classes.wrapper)}
		>
			{elements.map((element: IWebchatAttachmentElement, i: number) => (
				<SwiperSlide key={i} style={{ width: "206px" }}>
					<GalleryItem slide={element} contentId={`${carouselContentId}-${i}`} />
				</SwiperSlide>
			))}

			<ArrowBack className="gallery-button-prev" />
			<ArrowBack className="gallery-button-next" />
		</Swiper>
	);
};

export default Gallery;
