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

// Arabic-Indic numerals — the default for the Arabic-first phone app.
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

// The mosque imam asked for the standard Arabic (Hindu-Arabic) numerals 0-9 on
// the wall display, rather than the Eastern Arabic-Indic ٠-٩ set. (`latin` here
// is just the Unicode numbering-system name "latn".) Callers on the display
// pass `latin: true`; everything else keeps the Eastern Arabic-Indic set.
function digits(s: string | number, latin: boolean): string {
  return latin ? String(s) : toArabicDigits(s);
}

export function formatHM(d: Date, tz?: string, latin = false): string {
  return digits(
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }),
    latin,
  );
}

export function formatHMS(d: Date, tz?: string, latin = false): string {
  return digits(
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    }),
    latin,
  );
}

/** Arabic countdown like "بعد ٧س ٠٢د" or "خلال ٣٢د" or "خلال ٤٥ث". */
export function formatCountdownAr(ms: number, latin = false): string {
  if (ms <= 0) return "الآن";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `بعد ${digits(h, latin)}س ${digits(String(m).padStart(2, "0"), latin)}د`;
  }
  if (m > 0) {
    return `بعد ${digits(m, latin)}د ${digits(String(s).padStart(2, "0"), latin)}ث`;
  }
  return `بعد ${digits(s, latin)}ث`;
}

/** Arabic short date like "ا‎لأربعاء ٢٧ مايو". */
export function formatDateAr(d: Date, tz?: string, latin = false): string {
  // The `-u-nu-latn` extension keeps the Arabic month/weekday names but renders
  // the day number in Western digits.
  return new Intl.DateTimeFormat(latin ? "ar-EG-u-nu-latn" : "ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  }).format(d);
}

/** Arabic Hijri date like "١٢ ذو القعدة ١٤٤٧ هـ" (Umm al-Qura calendar). */
export function formatHijriDateAr(d: Date, tz?: string, latin = false): string {
  const parts = new Intl.DateTimeFormat(
    latin
      ? "ar-SA-u-ca-islamic-umalqura-nu-latn"
      : "ar-SA-u-ca-islamic-umalqura",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz,
    },
  ).formatToParts(d);
  // The year part already includes "هـ" suffix in ar-SA, but normalize to be sure.
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const yearClean = year.replace(/هـ?$/u, "").trim();
  return `${day} ${month} ${yearClean} هـ`;
}
