import { type Locale, intlTag } from "@/lib/i18n";

export const formatMoney = (value: number, locale: Locale = "tr") =>
  new Intl.NumberFormat(intlTag[locale], {
    style: "currency",
    currency: "TRY",
    currencyDisplay: locale === "tr" ? "symbol" : "narrowSymbol",
  }).format(value);

export const formatDateTime = (date: Date, locale: Locale = "tr") =>
  new Intl.DateTimeFormat(intlTag[locale], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

export const formatTime = (date: Date, locale: Locale = "tr") =>
  new Intl.DateTimeFormat(intlTag[locale], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
