// The one place that turns "a place and a date" into the times this phone
// actually shows and announces.
//
// The engine (shared/) is the mosque's ruling and is shared with the website.
// The user's per-prayer offsets (lib/prayer-prefs.ts) sit on top. Every
// consumer — the Times screen, the month table, the adhan notifications, the
// silence windows, the widget — must go through here, or one of them will
// eventually show a Maghrib the others disagree with. That was the bug this
// file was written to close: prefs were saved by the settings screen and
// previewed there, and honoured nowhere else.

import { computeDay, type PrayerName } from "@shared/prayer-engine";
import {
  applyPrefs,
  loadPrefs,
  type PrayerPrefs,
  type PrefsScopeSource,
} from "@/lib/prayer-prefs";

export type DayTimes = Record<PrayerName, Date>;

/** The engine's times for one civil day, with this user's offsets applied.
 *  Pure: no clock, no storage. */
export function adjustedDay(
  latitude: number,
  longitude: number,
  date: Date,
  prefs: PrayerPrefs,
): DayTimes {
  const raw = computeDay(latitude, longitude, date).primary.times;
  return applyPrefs(raw, prefs);
}

/** `horizon` consecutive days starting today, each adjusted. Pure. */
export function adjustedDays(
  latitude: number,
  longitude: number,
  prefs: PrayerPrefs,
  horizon: number,
  from: Date = new Date(),
): DayTimes[] {
  const out: DayTimes[] = [];
  for (let offset = 0; offset < horizon; offset++) {
    const date = new Date(from);
    date.setDate(date.getDate() + offset);
    out.push(adjustedDay(latitude, longitude, date, prefs));
  }
  return out;
}

/** Same as `adjustedDays`, loading the place's stored prefs first. This is
 *  what background schedulers call — they have a place, not a React tree. */
export async function adjustedDaysFor(
  place: PrefsScopeSource,
  horizon: number,
  from: Date = new Date(),
): Promise<{ prefs: PrayerPrefs; days: DayTimes[] }> {
  const prefs = await loadPrefs(place);
  return {
    prefs,
    days: adjustedDays(place.latitude, place.longitude, prefs, horizon, from),
  };
}
