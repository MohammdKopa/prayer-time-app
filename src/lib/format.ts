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

// Arabic-Indic numerals — used for all displayed times and dates.
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

export function formatHM(d: Date, tz?: string): string {
  return toArabicDigits(
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }),
  );
}

export function formatHMS(d: Date, tz?: string): string {
  return toArabicDigits(
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    }),
  );
}

/** Arabic countdown like "بعد ٧س ٠٢د" or "خلال ٣٢د" or "خلال ٤٥ث". */
export function formatCountdownAr(ms: number): string {
  if (ms <= 0) return "الآن";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `بعد ${toArabicDigits(h)}س ${toArabicDigits(String(m).padStart(2, "0"))}د`;
  }
  if (m > 0) {
    return `بعد ${toArabicDigits(m)}د ${toArabicDigits(String(s).padStart(2, "0"))}ث`;
  }
  return `بعد ${toArabicDigits(s)}ث`;
}

/** Arabic short date like "ا‎لأربعاء ٢٧ مايو". */
export function formatDateAr(d: Date, tz?: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  }).format(d);
}

/** Arabic Hijri date like "١٢ ذو القعدة ١٤٤٧ هـ" (Umm al-Qura calendar). */
export function formatHijriDateAr(d: Date, tz?: string): string {
  const parts = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
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
