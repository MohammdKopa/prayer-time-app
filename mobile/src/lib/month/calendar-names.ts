// Gregorian month and weekday names, by hand.
//
// Same reasoning as hijri.ts and time.ts: `Intl.DateTimeFormat` is the obvious
// implementation and the wrong one. Hermes ships a cut-down ICU whose locale
// data varies by Android version, and a locale it does not carry degrades to
// English *silently* — a German user would get "September" either way and a
// Turkish user would get "September" instead of "Eylül" with nothing to show
// something went wrong.
//
// These are names of calendar units, not UI phrases, so they live next to the
// calendar code rather than in the strings table — exactly where hijri.ts
// keeps its own month names.

import type { Locale } from "@/lib/i18n/strings";

const GREGORIAN_MONTHS: Record<Locale, readonly string[]> = {
  ar: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
  de: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  tr: [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

// Sunday first, to match `Date#getDay`. Two or three characters — these sit in
// a 58dp column next to the day number, and anything longer wraps.
//
// The Arabic row is the single-letter set, not a three-letter truncation.
// Arabic does not abbreviate by cutting a word short: "الأربعاء" clipped to
// "أرب" leaves the ب in its medial shape with a connector hanging off it, so
// it renders as a word that has been interrupted rather than shortened. CLDR
// agrees — its abbreviated Arabic weekdays are the full names, and the only
// short form it defines is this narrow one.
const WEEKDAYS_SHORT: Record<Locale, readonly string[]> = {
  ar: ["ح", "ن", "ث", "ر", "خ", "ج", "س"],
  de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  tr: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/**
 * Name of a Gregorian month, 0-11 as `Date#getMonth` reports it.
 *
 * @throws if `month` is out of range — a silent "undefined" in a month header
 * is the kind of bug that ships.
 */
export function gregorianMonthName(month: number, locale: Locale): string {
  const name = GREGORIAN_MONTHS[locale][month];
  if (!name) throw new Error(`gregorianMonthName: month ${month} is not 0-11`);
  return name;
}

/**
 * Short weekday name, 0-6 as `Date#getDay` reports it (0 = Sunday).
 *
 * @throws if `weekday` is out of range.
 */
export function weekdayShort(weekday: number, locale: Locale): string {
  const name = WEEKDAYS_SHORT[locale][weekday];
  if (!name) throw new Error(`weekdayShort: ${weekday} is not 0-6`);
  return name;
}

/** `Date#getDay` value for Friday — Jumu'ah, which the table marks. */
export const FRIDAY = 5;
