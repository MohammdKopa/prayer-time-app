import type { PrayerName } from "./prayer-engine";

export const PRAYER_LABEL_EN: Record<PrayerName, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const PRAYER_LABEL_AR: Record<PrayerName, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

// German prayer names — the conventional labels used on German mosque
// calendars (DITIB/IGMG). Shown as a small subtitle under the Arabic on the
// wall display, for the non-Arabic congregation.
export const PRAYER_LABEL_DE: Record<PrayerName, string> = {
  fajr: "Morgengebet",
  sunrise: "Sonnenaufgang",
  dhuhr: "Mittagsgebet",
  asr: "Nachmittagsgebet",
  maghrib: "Abendgebet",
  isha: "Nachtgebet",
};

// Numerals across the whole product are the standard Arabic (Hindu-Arabic) 0-9
// — what the imam asked for. The Eastern Arabic-Indic ٠-٩ set is no longer
// used; Arabic month/weekday names are kept via the `-u-nu-latn` numbering
// extension, which renders the digits as 0-9 while leaving the text Arabic.

export function formatHM(d: Date, tz?: string): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  });
}

export function formatHMS(d: Date, tz?: string): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  });
}

/** Arabic countdown like "بعد 7س 02د" or "بعد 32د 05ث" or "بعد 45ث". */
export function formatCountdownAr(ms: number): string {
  if (ms <= 0) return "الآن";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `بعد ${h}س ${String(m).padStart(2, "0")}د`;
  }
  if (m > 0) {
    return `بعد ${m}د ${String(s).padStart(2, "0")}ث`;
  }
  return `بعد ${s}ث`;
}

/** Arabic short date like "الأربعاء 27 مايو". */
export function formatDateAr(d: Date, tz?: string): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  }).format(d);
}

/** Arabic Hijri date like "12 ذو القعدة 1447 هـ" (Umm al-Qura calendar). */
export function formatHijriDateAr(d: Date, tz?: string): string {
  const parts = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).formatToParts(d);
  // The year part already includes "هـ" suffix in ar-SA, but normalize to be sure.
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const yearClean = year.replace(/هـ?$/u, "").trim();
  return `${day} ${month} ${yearClean} هـ`;
}
