import moment from "moment";
import l10n from "flatpickr/dist/l10n";
import { key as LocaleKey } from "flatpickr/dist/types/locale";
import { IMessage } from "@cognigy/socket-client";
import customPlugin from "./customPlugin";

const arrowIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.7578 1.34923C12.1172 1.76855 12.0687 2.39985 11.6494 2.75927L5.53516 8.00002L11.6494 13.2408C12.0687 13.6002 12.1172 14.2315 11.7578 14.6508C11.3984 15.0701 10.7671 15.1187 10.3478 14.7593L4.23357 9.51853C3.30235 8.72034 3.30235 7.2797 4.23357 6.4815L10.3478 1.24076C10.7671 0.881339 11.3984 0.929901 11.7578 1.34923Z" fill="white"/></svg>';

export const getOptionsFromMessage = (message: IMessage) => {
    // @ts-expect-error -> need to update IMessage type on socketclient
    const data = message?.data?._plugin?.data;
    if (!data) return {};

    const transformNamedDate = (namedDate: string) => {
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
    const timeWithSeconds = data.enableSeconds ? `${timeTemp}:S` : timeTemp;
    const timeFormat = data.time_24hr ? timeWithSeconds : `${timeWithSeconds} K`; //12-hour format with AM/PM

    if (localeId === "gb") locale = { ...locale, firstDayOfWeek: 1 };
    const options = {
        nextArrow: arrowIcon,
        prevArrow: arrowIcon,
        defaultHour: data.defaultHour || 12,
        defaultMinute: data.defaultMinute || 0,
        enableSeconds: data.enableSeconds || false,
        hourIncrement: data.hourIncrement || 1,
        minuteIncrement: data.minuteIncrement || 5,
        noCalendar: data.noCalendar || false,
        weekNumbers: data.weekNumbers || false,
        dateFormat: enableTime ? `${dateFormat} ${timeFormat}` : dateFormat,
        defaultDate,
        disable: [],
        enableTime,
        event: data.eventName,
        inline: true,
        locale,
        maxDate: transformNamedDate(data.maxDate) || "",
        minDate: transformNamedDate(data.minDate) || "",
        mode: data.mode || "single",
        static: true,
        time_24hr: data.time_24hr || false,
        parseDate: (dateString: string) => moment(dateString).toDate(),
        // if no custom formatting is defined, apply default formatting
        formatDate: !data.dateFormat
            ? (date: Date) =>
                    moment(date)
                        .locale(momentLocaleId)
                        .format(enableTime ? "L LT" : "L")
            : undefined,
        plugins: [customPlugin({arrowIcon: arrowIcon})]
    };

    const mask = [...(data.enable_disable || [])]
        // add special rule for weekends
        .map(dateString => {
            if (dateString === "weekends") return isWeekendDate;

            return dateString;
        })
        // resolve relative date names like today, tomorrow or yesterday
        .map(transformNamedDate);

    // the code in function_enable_disable was executed in a vm to check that its return value is from type boolean
    if (data?.function_enable_disable?.length > 0) {
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

    if (mask.length > 0 && data.wantDisable) {
        if (data.wantDisable) {
            // add date mask as blacklist
            options.disable = mask as never;
        }
    }

    // console.log(options);

    return options;
};