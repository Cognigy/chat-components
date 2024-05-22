import moment from "moment";
import l10n from "flatpickr/dist/l10n";
import { Options } from "flatpickr/dist/types/options";
import { key as LocaleKey } from "flatpickr/dist/types/locale";
import { IMessage } from "@cognigy/socket-client";
import customElements from "./flatpickr-plugins/customElements";
import arrowIcon from "src/assets/svg/arrow_back.svg?raw";

export const getOptionsFromMessage = (message: IMessage) => {
	if (!message?.data?._plugin || message.data._plugin.type !== "date-picker") return;

	const data = message.data._plugin.data;

	const transformNamedDate = (namedDate?: string) => {
		switch (namedDate) {
			case "today":
				return moment().format("YYYY-MM-DD");

			case "tomorrow":
				return moment().add(1, "days").format("YYYY-MM-DD");

			case "yesterday":
				return moment().add(-1, "days").format("YYYY-MM-DD");
		}

		return namedDate;
	};

	const getFlatpickrLocaleId = (locale: string) => {
		switch (locale) {
			case "us":
			case "gb":
			case "au":
			case "ca":
				return "en";
		}

		return locale as LocaleKey;
	};

	const getMomemtLocaleId = (locale: string) => {
		switch (locale) {
			case "au":
				return "en-au";
			case "ca":
				return "en-ca";
			case "gb":
				return "en-gb";
			case "us":
				return "en";
		}

		return locale;
	};

	const isWeekendDate = (date: string) => {
		const isoWeekday = moment(date).isoWeekday();

		switch (isoWeekday) {
			case 6: // saturday
			case 7: // sunday
				return true;
		}

		return false;
	};

	const dateFormat = data.dateFormat || "YYYY-MM-DD";
	const defaultDate =
		transformNamedDate(data.defaultDate) || transformNamedDate(data.minDate) || undefined;

	const localeId = data.locale || "us";
	const momentLocaleId = getMomemtLocaleId(localeId);
	const flatpickrLocaleId = getFlatpickrLocaleId(localeId);
	let locale = l10n[flatpickrLocaleId];
	const enableTime = !!data.enableTime;
	const timeTemp = data.time_24hr ? "H:i" : "h:i"; //12-hour format without AM/PM
	const timeFormat = data.time_24hr ? timeTemp : `${timeTemp} K`; //12-hour format with AM/PM

	if (localeId === "gb") locale = { ...locale, firstDayOfWeek: 1 };
	const options: Options = {
		nextArrow: arrowIcon,
		prevArrow: arrowIcon,
		defaultHour: data?.defaultHour || 12,
		defaultMinute: data?.defaultMinute || 0,
		hourIncrement: data?.hourIncrement || 1,
		minuteIncrement: data?.minuteIncrement || 5,
		noCalendar: !!data?.noCalendar,
		weekNumbers: !!data?.weekNumbers,
		dateFormat: enableTime ? `${dateFormat} ${timeFormat}` : dateFormat,
		defaultDate,
		disable: [],
		enable: [],
		enableTime,
		inline: true,
		locale,
		maxDate: transformNamedDate(data.maxDate) || "",
		minDate: transformNamedDate(data.minDate) || "",
		mode: data.mode || "single",
		static: true,
		time_24hr: !!data?.time_24hr,
		parseDate: (dateString: string) => moment(dateString).toDate(),
		// if no custom formatting is defined, apply default formatting
		formatDate: !data.dateFormat
			? (date: Date) =>
					moment(date)
						.locale(momentLocaleId)
						.format(enableTime ? "L LT" : "L")
			: undefined,
		plugins: [customElements({ arrowIcon })],
	};

	// we need this value because user can directly submit the defaut date
	const defaultDateFormatted = defaultDate
		? moment(defaultDate)
				.locale(momentLocaleId)
				.format(enableTime ? "L LT" : "L")
		: undefined;

	const enable_disable =
		Array.isArray(data?.enable_disable) && data.enable_disable.length > 0
			? data.enable_disable
			: null;

	const mask = enable_disable
		? [...enable_disable]
				// resolve relative date names like today, tomorrow or yesterday
				.map(transformNamedDate)
				// add special rule for weekends
				.map(dateString => {
					if (dateString === "weekends") return isWeekendDate;
					return dateString;
				})
		: [];

	// the code in function_enable_disable was executed in a vm to check that its return value is from type boolean
	if (data?.function_enable_disable && data?.function_enable_disable?.length > 0) {
		try {
			const flatpickrFn = new Function(
				`"use strict"; return  ${data.function_enable_disable}`,
			)();
			/* The Flatpickr function takes in a Date object */
			if (typeof flatpickrFn(new Date()) === "boolean") {
				mask.push(flatpickrFn);
			}
		} catch (e) {
			console.log(e);
		}
	}

	if (mask.length > 0) {
		if (data.wantDisable) {
			// add date mask as blacklist
			options.disable = mask as never;
			delete options.enable;
		} else {
			// add date mask as whitelist
			options.enable = mask as never;
		}
	} else {
		delete options.enable;
	}

	return { options, defaultDateFormatted };
};
