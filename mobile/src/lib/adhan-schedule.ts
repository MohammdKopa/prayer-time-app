// The pure half of the adhan scheduler: identifiers and the fingerprint
// that decides whether the alarms already in AlarmManager can be kept.
//
// Split out of notifications.ts so it can be tested under node — that file
// imports expo-notifications, which needs a native runtime.

import type { NotifiedPrayer } from "@/lib/prayer-prefs";

/** Days ahead to schedule. Android caps concurrent alarms well above this,
 *  and every app open pushes the horizon back out. */
export const HORIZON_DAYS = 7;

/** Every adhan notification carries this prefix, so it can be cancelled
 *  without touching anything else scheduled by the app. */
export const ID_PREFIX = "adhan-";

/** The one-off notification the voice picker's "play sample" fires. */
export const PREVIEW_ID = "adhan-preview";

export const NOTIFIED: readonly NotifiedPrayer[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/**
 * Every identifier this app schedules — and every one an earlier build did.
 *
 * Cancelling by listing alone proved leaky: after moving from Marl to another
 * city the phone rang for both, each at its own local time, which can only
 * happen if an old schedule survived a reschedule. Whether the listing
 * silently omitted entries or an older build's ids slipped past it, naming
 * every possible id and cancelling it blind is cheap (a few hundred no-ops)
 * and cannot miss.
 */
export function ownIdentifiers(): string[] {
  const ids: string[] = [];
  // Old builds scheduled a shorter horizon too, so HORIZON_DAYS covers them.
  for (let day = 0; day < HORIZON_DAYS; day++) {
    for (const p of NOTIFIED) {
      ids.push(alertIdentifier(p, "adhan", day));
      ids.push(alertIdentifier(p, "reminder", day));
      ids.push(`${ID_PREFIX}${p}-${day}`); // pre-reminder builds
    }
  }
  ids.push(PREVIEW_ID);
  return ids;
}

/**
 * The builds up to 49c6698 (2026-09-17) scheduled the adhan with NO
 * identifier, so expo-notifications minted a UUID for each, and cleared them
 * with cancelAllScheduledNotificationsAsync(). The next build switched to
 * cancelling by prefix to spare the dua reminders — and the last UUID set the
 * old build had made (35 alarms for Marl) was never cancelled by anything
 * again. Every prayer rang twice for as long as that set lasted, and it kept
 * ringing for Marl after a move. Nothing else in this app schedules without
 * an identifier, so a UUID in the queue is that leftover, and is cancelled.
 */
export function isOrphanIdentifier(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function alertIdentifier(
  prayer: NotifiedPrayer,
  kind: "adhan" | "reminder",
  dayOffset: number,
): string {
  return `${ID_PREFIX}${prayer}-${kind}-${dayOffset}`;
}

/** Bumped whenever the id scheme, the horizon or the content shape changes,
 *  so a build that schedules differently never trusts its predecessor's
 *  alarms. */
const SCHEMA = 2;

export interface FingerprintInput {
  latitude: number;
  longitude: number;
  /** The city name goes into the notification body. */
  placeName: string;
  /** Everything about the per-prayer prefs that affects what is scheduled:
   *  offsets, styles, reminder minutes. Any stable serialisation will do. */
  prefsKey: string;
  voice: string;
  /** A sample of the translated text the notifications carry, so a language
   *  change is a change. */
  textSample: string;
  /** Local civil date the schedule was built on, YYYY-MM-DD. */
  day: string;
}

/**
 * What the current alarms were built from.
 *
 * Rescheduling is not free on Android: every one of the ~100 cancels and
 * ~35 schedules is a broadcast into expo-notifications' receiver, which
 * serialises the request and rewrites SharedPreferences. Doing that on every
 * app open — twice, because the saved place and then the GPS fix each trigger
 * it — was the single biggest thing between the splash and the first frame.
 *
 * If nothing in this fingerprint changed since the last successful run, the
 * alarms sitting in AlarmManager are already the right ones and the storm is
 * skipped (after one cheap listing to confirm they are still there).
 *
 * Coordinates are rounded to two decimals, about a kilometre: prayer times
 * move by roughly four seconds per kilometre, and GPS jitter across town
 * must not count as a change. The day is included so the horizon is pushed
 * out once per day and no more.
 */
export function scheduleFingerprint(input: FingerprintInput): string {
  return [
    `v${SCHEMA}`,
    `h${HORIZON_DAYS}`,
    input.latitude.toFixed(2),
    input.longitude.toFixed(2),
    input.placeName,
    input.voice,
    input.day,
    input.textSample,
    input.prefsKey,
  ].join("|");
}

/** Local civil date as YYYY-MM-DD — the day the schedule was built on. */
export function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
