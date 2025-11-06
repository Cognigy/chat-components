import { FC, useEffect, useMemo } from "react";
import { useLiveRegion, useMessageContext, useRandomId } from "src/messages/hooks";
import classes from "./Gallery.module.css";
import classnames from "classnames";
import { getChannelPayload, interpolateString } from "src/utils";
import { getGalleryContent } from "./helper";
import { ArrowBack as ArrowNavIcon } from "src/assets/svg";
import { Navigation, Pagination, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import GalleryItem from "./GalleryItem";
import { IWebchatAttachmentElement, IWebchatTemplateAttachment } from "@cognigy/socket-client";

const Gallery: FC = () => {
	const { message, config, "data-message-id": dataMessageId } = useMessageContext();
	const isSanitizeEnabled = !config?.settings?.layout?.disableHtmlContentSanitization;
	const customAllowedHtmlTags = config?.settings?.widgetSettings?.customAllowedHtmlTags;
	const { slide, actionButtonPositionText } = config?.settings.customTranslations?.ariaLabels || {};

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

	// Remove the default `aria-live="polite"` attribute added by React-Swiper to the `.swiper-wrapper`.
	// This ensures that the gallery message does not interfere with other live region announcements.
	useEffect(() => {
		const galleryMessage = document.querySelector(`[data-message-id="${dataMessageId}"]`);
		const swiperWrapper = galleryMessage?.querySelector(".swiper-wrapper");
		if (swiperWrapper) {
			swiperWrapper.removeAttribute("aria-live");
		}
	}, [dataMessageId]);

	// Gather the gallery content for live region announcements
	const slides = useMemo(
		() => getGalleryContent(elements, isSanitizeEnabled, customAllowedHtmlTags),
		[elements, isSanitizeEnabled, customAllowedHtmlTags],
	);

	// Aria label for each slide in the gallery
	const slideLabelMessage = useMemo(() => {
		if (!slide || !actionButtonPositionText) {
			return "Slide {{index}} of {{slidesLength}}";
		}

		const customSlidePosition = interpolateString(
			`${slide}: ${actionButtonPositionText}`,
			{
				position: "{{index}}",
				total: "{{slidesLength}}",
			}
		);

		return customSlidePosition;

	}, [slide, actionButtonPositionText]);

	useLiveRegion({
		messageType: "gallery",
		data: { slides },
		validation: () => !!elements && elements.length > 0 && slides.length === elements.length,
	});

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
			a11y={{ slideLabelMessage }}
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
