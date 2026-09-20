// The mosque display: settings and the pure bits of its logic.
//
// A phone or tablet on a plasma at the entrance of ANY mosque. Nothing here
// is Marl-specific: the times come from the app's place and the prayer
// offsets the mosque already tuned, the name is whatever the mosque types,
// and Jumuʿa is a time only when they set one — the first thing the screen
// asks for, because it differs from one mosque to the next. Everything is
// stored on the device; nothing leaves it.
//
// The React screen is mobile/src/app/display.tsx; this file is what can be
// unit-tested.

import type { PrayerName } from "@shared/prayer-engine";
import { loadSetting, saveSetting } from "@/lib/storage";

const NAME_KEY = "displayMosqueName";
const JUMUA_KEY = "displayJumua";
const CONFIGURED_KEY = "displayConfigured";

export interface DisplaySettings {
  /** Shown in the header. Empty → "مسجد <place>" is composed at render. */
  mosqueName: string;
  /** "HH:MM" or empty. Empty → Friday shows the astronomical Dhuhr. */
  jumua: string;
  /** False until the setup step has been completed once on this device. */
  configured: boolean;
}

export const EMPTY_DISPLAY_SETTINGS: DisplaySettings = {
  mosqueName: "",
  jumua: "",
  configured: false,
};

export async function loadDisplaySettings(): Promise<DisplaySettings> {
  const [name, jumua, configured] = await Promise.all([
    loadSetting(NAME_KEY),
    loadSetting(JUMUA_KEY),
    loadSetting(CONFIGURED_KEY),
  ]);
  return {
    mosqueName: name ?? "",
    jumua: parseClock(jumua ?? "") ? (jumua as string) : "",
    configured: configured === "1",
  };
}

export async function saveDisplaySettings(s: DisplaySettings): Promise<void> {
  await Promise.all([
    saveSetting(NAME_KEY, s.mosqueName.trim()),
    saveSetting(JUMUA_KEY, parseClock(s.jumua) ? s.jumua.trim() : ""),
    saveSetting(CONFIGURED_KEY, s.configured ? "1" : "0"),
  ]);
}

/** "14:00" / "9:30" → { h, m }; anything else → null. Arabic-Indic digits accepted. */
export function parseClock(s: string): { h: number; m: number } | null {
  const ascii = s
    .trim()
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[．。]/g, ":");
  const m = ascii.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return { h, m: mm };
}

/** Local Date for HH:MM on the same calendar day as `day`. */
export function clockOn(day: Date, clock: { h: number; m: number }): Date {
  const d = new Date(day);
  d.setHours(clock.h, clock.m, 0, 0);
  return d;
}

export function isFriday(d: Date): boolean {
  return d.getDay() === 5;
}

/**
 * The times the display shows: on a Friday with a Jumuʿa time set, the
 * Dhuhr slot becomes the Jumuʿa time — countdown, highlight and card all
 * follow it, exactly as the congregation expects. Every other day, and on
 * Fridays without a set time, the astronomical times pass through.
 */
export function displayTimes(
  times: Record<PrayerName, Date>,
  day: Date,
  jumua: string,
): { times: Record<PrayerName, Date>; jumua: boolean } {
  if (!isFriday(day)) return { times, jumua: false };
  const clock = parseClock(jumua);
  if (!clock) return { times, jumua: true };
  return { times: { ...times, dhuhr: clockOn(day, clock) }, jumua: true };
}

const STATUS_ORDER: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

/** "It's prayer time now" — the prayer whose time began within the last two minutes. */
export function prayerNowAt(
  times: Record<PrayerName, Date>,
  now: Date,
  windowMs = 120_000,
): PrayerName | null {
  for (const p of STATUS_ORDER) {
    const t = times[p].getTime();
    if (Number.isNaN(t)) continue;
    if (now.getTime() >= t && now.getTime() - t < windowMs) return p;
  }
  return null;
}

/** Gentle auto-dim in the dead of night to spare the panel: 0 … 0.45. */
export function nightDimAt(now: Date): number {
  const h = now.getHours();
  if (h >= 0 && h < 5) return 0.45;
  if (h === 5 || h === 23) return 0.28;
  return 0;
}

// ── Sayings ──────────────────────────────────────────────────────────────

export interface Saying {
  kind: "quran" | "hadith" | "dhikr";
  text: string;
  source?: string;
}

// The footer rotates through these — Arabic on every wall, whatever the app
// language, because the āyāt and adhkār are read in Arabic.
export const SAYINGS: Saying[] = [
  { kind: "dhikr", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ" },
  { kind: "quran", text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ" },
  { kind: "hadith", text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", source: "متفق عليه" },
  { kind: "dhikr", text: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ" },
  { kind: "quran", text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ" },
  { kind: "hadith", text: "الطُّهُورُ شَطْرُ الإِيمَانِ", source: "رواه مسلم" },
  { kind: "dhikr", text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ" },
  { kind: "quran", text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا" },
  { kind: "hadith", text: "الدِّينُ النَّصِيحَةُ", source: "رواه مسلم" },
  { kind: "dhikr", text: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ" },
  { kind: "quran", text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ" },
  { kind: "hadith", text: "الكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ", source: "متفق عليه" },
  { kind: "dhikr", text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ" },
  { kind: "quran", text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا" },
  {
    kind: "hadith",
    text: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ",
    source: "رواه البخاري",
  },
  {
    kind: "dhikr",
    text: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ",
  },
  { kind: "quran", text: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي" },
  {
    kind: "hadith",
    text: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    source: "متفق عليه",
  },
  { kind: "quran", text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ" },
  {
    kind: "hadith",
    text: "المُسْلِمُ مَنْ سَلِمَ المُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    source: "متفق عليه",
  },
];

export const SAYINGS_FRIDAY: Saying[] = [
  {
    kind: "quran",
    text: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ",
  },
  {
    kind: "hadith",
    text: "خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الجُمُعَةِ",
    source: "رواه مسلم",
  },
  { kind: "dhikr", text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ" },
  { kind: "hadith", text: "أَكْثِرُوا الصَّلَاةَ عَلَيَّ يَوْمَ الجُمُعَةِ", source: "رواه أبو داود" },
  {
    kind: "quran",
    text: "فَإِذَا قُضِيَتِ الصَّلَاةُ فَانتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِن فَضْلِ اللَّهِ",
  },
  {
    kind: "hadith",
    text: "فِي الجُمُعَةِ سَاعَةٌ لَا يُوَافِقُهَا مُسْلِمٌ يَسْأَلُ اللَّهَ خَيْرًا إِلَّا أَعْطَاهُ",
    source: "متفق عليه",
  },
  { kind: "dhikr", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ" },
];

/** One saying every SAYING_PERIOD_S, cycling — same cadence as the website's wall. */
export const SAYING_PERIOD_S = 12;

export function sayingAt(now: Date, friday: boolean, periodSec = SAYING_PERIOD_S): Saying {
  const list = friday ? SAYINGS_FRIDAY : SAYINGS;
  const slot = Math.floor(now.getTime() / 1000 / periodSec);
  return list[slot % list.length];
}

/** The ornaments around a saying: muṣḥaf brackets for Qurʾān, guillemets for
 *  ḥadīth, a lozenge for dhikr. Wrapping non-Qurʾān in ﴿ ﴾ would be wrong. */
export function sayingMarks(s: Saying): { open: string; close: string } {
  if (s.kind === "quran") return { open: "﴿", close: "﴾" };
  if (s.kind === "hadith") return { open: "«", close: "»" };
  return { open: "◆", close: "◆" };
}

// ── Photos ───────────────────────────────────────────────────────────────
//
// Real photographs of al-Masjid al-Aqṣā (al-Quds), al-Masjid al-Ḥarām
// (Makkah) and the Umayyad Mosque (Damascus) — a quiet reminder on the wall
// to hold these places, and their people, in duʿāʾ. Files and credits:
// mobile/assets/photos/CREDITS.md.

export interface PhotoText {
  text: string;
  /** Marks an actual āyah — only those get the ﴿ ﴾ ornament. */
  quran?: boolean;
}

export interface DisplayPhotoMeta {
  /** Bundled file name under mobile/assets/photos — the require() lives in
   *  display-photos.ts so this module stays loadable under node for tests. */
  file: "aqsa.jpg" | "makkah.jpg" | "umayyad-damascus.jpg";
  /** Arabic place name, shown beneath the text. */
  place: string;
  /** Subtitle for the non-Arabic congregation, by app language. */
  placeSub: { de: string; tr: string; en: string };
  /** Rotate: each time the photo comes back around, the next line shows. */
  texts: PhotoText[];
}

export const DISPLAY_PHOTO_META: DisplayPhotoMeta[] = [
  {
    file: "aqsa.jpg",
    place: "قُبَّةُ الصَّخْرَة · القُدس",
    placeSub: { de: "Felsendom · Jerusalem", tr: "Kubbetüs Sahra · Kudüs", en: "Dome of the Rock · Jerusalem" },
    texts: [
      {
        quran: true,
        text: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِنَ الْمَسْجِدِ الْحَرَامِ إِلَى الْمَسْجِدِ الْأَقْصَى الَّذِي بَارَكْنَا حَوْلَهُ",
      },
      { text: "اللّٰهُمَّ ارْزُقْنَا الصَّلَاةَ فِي رِحَابِ الْأَقْصَىٰ" },
      { text: "اللّٰهُمَّ احْفَظِ الْمَسْجِدَ الْأَقْصَىٰ وَأَهْلَهُ" },
      {
        quran: true,
        text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      },
    ],
  },
  {
    file: "makkah.jpg",
    place: "اَلْمَسْجِدُ الْحَرَام · مَكَّة",
    placeSub: { de: "Die heilige Moschee · Mekka", tr: "Mescid-i Haram · Mekke", en: "The Sacred Mosque · Makkah" },
    texts: [
      { text: "اللّٰهُمَّ ارْزُقْنَا حَجَّ بَيْتِكَ الْحَرَام" },
      {
        quran: true,
        text: "إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ مُبَارَكًا",
      },
      {
        quran: true,
        text: "رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
      },
      { text: "لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ ۖ لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ" },
    ],
  },
  {
    file: "umayyad-damascus.jpg",
    place: "اَلْجَامِعُ الْأُمَوِيّ · دِمَشْق",
    placeSub: { de: "Umayyaden-Moschee · Damaskus", tr: "Emevi Camii · Şam", en: "Umayyad Mosque · Damascus" },
    texts: [
      { text: "اللّٰهُمَّ احْفَظْ بِلَادَ الشَّام وَأَهْلَهَا" },
      // Prophetic duʿāʾ for al-Shām (al-Bukhārī).
      { text: "اللّٰهُمَّ بَارِكْ لَنَا فِي شَامِنَا" },
      { text: "اللّٰهُمَّ اجْعَلِ الشَّامَ دَارَ أَمْنٍ وَإِيمَان" },
      // The "blessed land" — classically understood to include al-Shām.
      {
        quran: true,
        text: "وَنَجَّيْنَاهُ وَلُوطًا إِلَى الْأَرْضِ الَّتِي بَارَكْنَا فِيهَا لِلْعَالَمِينَ",
      },
    ],
  },
];

/** A photo fades up for PHOTO_SHOW_S, then the wall returns to the clock for
 *  the rest of PHOTO_CYCLE_S. Driven off `now`, so it never drifts. */
export const PHOTO_CYCLE_S = 300;
export const PHOTO_SHOW_S = 22;

export function photoAt<P extends DisplayPhotoMeta>(
  now: Date,
  photos: P[],
): { photo: P; line: PhotoText; active: boolean; slot: number } {
  const epoch = Math.floor(now.getTime() / 1000);
  const slot = Math.floor(epoch / PHOTO_CYCLE_S);
  const cyclePos = epoch % PHOTO_CYCLE_S;
  const index = ((slot % photos.length) + photos.length) % photos.length;
  const photo = photos[index];
  const round = Math.floor(slot / photos.length);
  const line = photo.texts[round % photo.texts.length];
  return { photo, line, active: cyclePos < PHOTO_SHOW_S, slot };
}

// ---------------------------------------------------------------------------
// Wall sun arc
// ---------------------------------------------------------------------------

/** The sun arc's viewBox, shared by the drawing and the label overlay. */
export const ARC_VIEWBOX = { width: 1000, height: 372 } as const;

/**
 * Where `preserveAspectRatio="xMidYMid meet"` puts that viewBox inside a box
 * of `w` x `h` device pixels: one uniform scale, letterboxed on the long axis.
 *
 * The prayer names are drawn as real `<Text>` rather than SVG text — Android's
 * SVG text does not join Arabic letters — so the overlay has to reproduce this
 * mapping by hand to land on the dots.
 */
export function fitViewBox(
  w: number,
  h: number,
  view: { width: number; height: number } = ARC_VIEWBOX,
): { scale: number; offsetX: number; offsetY: number } {
  if (!(w > 0) || !(h > 0)) return { scale: 0, offsetX: 0, offsetY: 0 };
  const scale = Math.min(w / view.width, h / view.height);
  return {
    scale,
    offsetX: (w - view.width * scale) / 2,
    offsetY: (h - view.height * scale) / 2,
  };
}
