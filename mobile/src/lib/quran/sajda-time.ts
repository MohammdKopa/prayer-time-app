import type { PrayerName } from "@shared/prayer-engine";

import { SAJDAS } from "./meta";

// The times in which voluntary prayer is avoided, for the note shown at an
// āyah of prostration.
//
// The hadith are agreed (Muslim 831 from ʿUqba b. ʿĀmir: when the sun is
// rising until it is up, at its zenith until it declines, and as it sets;
// al-Bukhārī 586: after Fajr until sunrise, after ʿAṣr until sunset). Whether
// sajdat al-tilāwa falls under them is not: the Ḥanafīs avoid it in these
// times, the Shāfiʿīs allow it because it has a cause. So the reader only
// *reminds*, never forbids, and the wording ships only once Sheikh Ayman has
// confirmed it (docs/dua-content-review.md, "Sajda note"). Until then
// SAJDA_TIME_NOTE_REVIEWED keeps it off.
//
// The app cannot know whether someone has prayed Fajr or ʿAṣr, so "after
// Fajr/ʿAṣr" here means after the time has come in, which is the stricter
// reading and the one that never tells someone it is fine when it is not.

export const SAJDA_TIME_NOTE_REVIEWED = false;

/** Minutes after sunrise until the sun counts as risen ("a spear's length").
 *  Commonly 15–20; to be confirmed with the sheikh. */
export const SUN_RISEN_MINUTES = 15;

/** Minutes before Dhuhr counted as the zenith. Commonly 5–10; to confirm. */
export const ZENITH_MINUTES = 10;

export type RestrictedKind = "afterFajr" | "sunrise" | "zenith" | "afterAsr";

export interface RestrictedWindow {
  kind: RestrictedKind;
  /** When the window ends: the moment the note can go away. */
  until: Date;
}

const minutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

/**
 * Which restricted window `now` falls in, given that day's prayer times, or
 * null outside all of them. Isha to Fajr is not restricted.
 */
export function restrictedWindow(
  now: Date,
  times: Record<PrayerName, Date>,
): RestrictedWindow | null {
  const t = now.getTime();
  const risen = minutes(times.sunrise, SUN_RISEN_MINUTES);
  if (t >= times.fajr.getTime() && t < times.sunrise.getTime()) {
    return { kind: "afterFajr", until: risen };
  }
  if (t >= times.sunrise.getTime() && t < risen.getTime()) {
    return { kind: "sunrise", until: risen };
  }
  if (t >= minutes(times.dhuhr, -ZENITH_MINUTES).getTime() && t < times.dhuhr.getTime()) {
    return { kind: "zenith", until: times.dhuhr };
  }
  if (t >= times.asr.getTime() && t < times.maghrib.getTime()) {
    return { kind: "afterAsr", until: times.maghrib };
  }
  return null;
}

const SAJDA_KEYS = new Set(SAJDAS.map((s) => `${s.surah}:${s.ayah}`));

export function isSajdaAyah(surah: number, ayah: number): boolean {
  return SAJDA_KEYS.has(`${surah}:${ayah}`);
}
