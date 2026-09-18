// Per-prayer personalisation: manual offsets, notification style, reminders.
//
// WHY THIS IS NOT IN THE ENGINE. shared/prayer-engine.ts carries the mosque's
// ruling and is shared with the website. A user who knows his masjid calls
// Asr three minutes late must be able to say so without the website inheriting
// his three minutes. So the engine stays authoritative and untouched, and
// everything here is applied strictly on top of its output.
//
// Everything below the storage functions is pure: `applyPrefs` takes the
// engine's times and returns new Dates, mutating nothing and reading no clock.
// That is deliberate — offsets are the one thing in this app that can silently
// make a shown time wrong, so the rule that decides them has to be testable in
// isolation.

import { PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";
import { loadJSON, saveJSON } from "@/lib/storage";

/** Sunrise is shown but is not a prayer. Its time can be nudged — a printed
 *  timetable may put it a minute off — but it is never announced, so it is
 *  excluded from notifications at the type level. */
export type NotifiedPrayer = Exclude<PrayerName, "sunrise">;

export const NOTIFIED_PRAYERS: readonly NotifiedPrayer[] = PRAYER_ORDER.filter(
  (p): p is NotifiedPrayer => p !== "sunrise",
);

/** How far a single prayer may be moved, either way. Thirty minutes covers
 *  every real masjid; past that the user has the wrong city, not an offset. */
export const OFFSET_LIMIT_MINUTES = 30;

/** The smallest gap left between two prayers when an offset is capped. One
 *  minute, because the clock only shows minutes — anything less would render
 *  as two prayers at the same time. */
export const MIN_GAP_MINUTES = 1;

export const REMINDER_PRESETS = [5, 10, 15] as const;
export const REMINDER_MIN_MINUTES = 1;
export const REMINDER_MAX_MINUTES = 120;

/**
 * What a prayer's notification sounds like.
 *
 * - `"adhan"`  — the full adhan. The default.
 * - `"beep"`   — a short tone, for prayers you want noticed but not announced.
 * - `"silent"` — the banner appears, nothing is played.
 * - `"off"`    — nothing at all, reminder included.
 */
export const NOTIFICATION_STYLES = ["adhan", "beep", "silent", "off"] as const;
export type NotificationStyle = (typeof NOTIFICATION_STYLES)[number];

export const DEFAULT_NOTIFICATION_STYLE: NotificationStyle = "adhan";

export interface PrayerPrefs {
  /** Minutes to add to the calculated time, −30…+30. Sunrise included. */
  offsets: Record<PrayerName, number>;
  notify: Record<NotifiedPrayer, NotificationStyle>;
  /** Minutes before the adhan to warn, or null for no reminder. */
  reminderMinutes: Record<NotifiedPrayer, number | null>;
}

export function defaultPrefs(): PrayerPrefs {
  const offsets = {} as Record<PrayerName, number>;
  for (const p of PRAYER_ORDER) offsets[p] = 0;

  const notify = {} as Record<NotifiedPrayer, NotificationStyle>;
  const reminderMinutes = {} as Record<NotifiedPrayer, number | null>;
  for (const p of NOTIFIED_PRAYERS) {
    notify[p] = DEFAULT_NOTIFICATION_STYLE;
    reminderMinutes[p] = null;
  }

  return { offsets, notify, reminderMinutes };
}

// ---------------------------------------------------------------- validation

export function clampOffset(minutes: number): number {
  if (!Number.isFinite(minutes)) return 0;
  return Math.max(
    -OFFSET_LIMIT_MINUTES,
    Math.min(OFFSET_LIMIT_MINUTES, Math.round(minutes)),
  );
}

export function clampReminder(minutes: number | null): number | null {
  if (minutes === null || !Number.isFinite(minutes)) return null;
  const n = Math.round(minutes);
  if (n <= 0) return null;
  return Math.max(REMINDER_MIN_MINUTES, Math.min(REMINDER_MAX_MINUTES, n));
}

function isStyle(v: unknown): v is NotificationStyle {
  return (NOTIFICATION_STYLES as readonly unknown[]).includes(v);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null
    ? (v as Record<string, unknown>)
    : null;
}

/**
 * Turn whatever came out of storage into a usable set of preferences.
 *
 * Stored JSON is untrusted: it may be from an older build, a half-finished
 * write, or a key another app wrote into the same store. Every field is read
 * defensively and falls back to its default, so a corrupted preference shows
 * the calculated time rather than taking the screen down.
 */
export function normalizePrefs(raw: unknown): PrayerPrefs {
  const base = defaultPrefs();
  const src = asRecord(raw);
  if (!src) return base;

  const offsets = asRecord(src.offsets);
  const notify = asRecord(src.notify);
  const reminders = asRecord(src.reminderMinutes);

  for (const p of PRAYER_ORDER) {
    const v = offsets?.[p];
    if (typeof v === "number") base.offsets[p] = clampOffset(v);
  }
  for (const p of NOTIFIED_PRAYERS) {
    const style = notify?.[p];
    if (isStyle(style)) base.notify[p] = style;

    const r = reminders?.[p];
    if (typeof r === "number") base.reminderMinutes[p] = clampReminder(r);
  }
  return base;
}

/** True when nothing has been personalised — used to hide "reset all". */
export function isDefaultPrefs(prefs: PrayerPrefs): boolean {
  for (const p of PRAYER_ORDER) if (prefs.offsets[p] !== 0) return false;
  for (const p of NOTIFIED_PRAYERS) {
    if (prefs.notify[p] !== DEFAULT_NOTIFICATION_STYLE) return false;
    if (prefs.reminderMinutes[p] !== null) return false;
  }
  return true;
}

// ------------------------------------------------------------------- storage

/** Just enough of a Place to key storage on. Structural rather than importing
 *  `Place`, so nothing that only needs prefs pulls expo-location in with it. */
export interface PrefsScopeSource {
  name: string;
  latitude: number;
  longitude: number;
}

const KEY_PREFIX = "prefs:";

/**
 * Offsets belong to a masjid, not to a phone: whoever knows that Marl calls
 * Asr three minutes late knows nothing about Bochum. So they are stored per
 * place.
 *
 * Keyed on the name rather than the coordinates because GPS coordinates move
 * every time the user walks across town, and `describe()` in location.ts
 * already resolves a GPS fix to the nearest known city within 25 km — so Marl
 * by GPS and Marl picked by hand land on the same key, which is what the user
 * means. A nameless place falls back to coordinates rounded to two decimals
 * (about a kilometre), which is what describe() itself falls back to.
 */
export function prefsScope(place: PrefsScopeSource): string {
  const name = place.name?.trim().toLowerCase().replace(/\s+/g, "-");
  if (name) return name;
  return `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
}

export async function loadPrefs(place: PrefsScopeSource): Promise<PrayerPrefs> {
  const raw = await loadJSON<unknown>(KEY_PREFIX + prefsScope(place));
  return normalizePrefs(raw);
}

export async function savePrefs(
  place: PrefsScopeSource,
  prefs: PrayerPrefs,
): Promise<void> {
  await saveJSON(KEY_PREFIX + prefsScope(place), prefs);
}

// ------------------------------------------------------------------- editing
//
// All immutable: the screen holds one prefs object in state and replaces it,
// which keeps React's equality checks honest and makes an accidental in-place
// edit impossible.

export function withOffset(
  prefs: PrayerPrefs,
  prayer: PrayerName,
  minutes: number,
): PrayerPrefs {
  return {
    ...prefs,
    offsets: { ...prefs.offsets, [prayer]: clampOffset(minutes) },
  };
}

export function nudgeOffset(
  prefs: PrayerPrefs,
  prayer: PrayerName,
  delta: number,
): PrayerPrefs {
  return withOffset(prefs, prayer, prefs.offsets[prayer] + delta);
}

export function withNotify(
  prefs: PrayerPrefs,
  prayer: NotifiedPrayer,
  style: NotificationStyle,
): PrayerPrefs {
  return { ...prefs, notify: { ...prefs.notify, [prayer]: style } };
}

export function withReminder(
  prefs: PrayerPrefs,
  prayer: NotifiedPrayer,
  minutes: number | null,
): PrayerPrefs {
  return {
    ...prefs,
    reminderMinutes: {
      ...prefs.reminderMinutes,
      [prayer]: clampReminder(minutes),
    },
  };
}

/** Back to the calculated time and the default notification for one prayer. */
export function resetPrayer(
  prefs: PrayerPrefs,
  prayer: PrayerName,
): PrayerPrefs {
  const next: PrayerPrefs = {
    offsets: { ...prefs.offsets, [prayer]: 0 },
    notify: { ...prefs.notify },
    reminderMinutes: { ...prefs.reminderMinutes },
  };
  if (prayer !== "sunrise") {
    next.notify[prayer] = DEFAULT_NOTIFICATION_STYLE;
    next.reminderMinutes[prayer] = null;
  }
  return next;
}

// -------------------------------------------------------------- the pure bit

const MS_PER_MINUTE = 60_000;
const MIN_GAP_MS = MIN_GAP_MINUTES * MS_PER_MINUTE;

export interface AdjustedDay {
  /** The times to show and to schedule. */
  times: Record<PrayerName, Date>;
  /** Minutes actually applied. Equal to the requested offset unless it had to
   *  be capped, so the screen can show what the user really got. */
  applied: Record<PrayerName, number>;
  /** True where `applied` differs from the requested offset. Principle: no
   *  unexplained times — if an offset is quietly shrunk, the UI says so. */
  capped: Record<PrayerName, boolean>;
}

/**
 * ORDER IS NEVER BROKEN.
 *
 * An offset can, at a bad latitude in deep winter, ask for something
 * impossible: Asr and Maghrib can sit twenty minutes apart, and +30 on Asr
 * would put it after Maghrib. A prayer list that reads Maghrib, Asr is broken
 * in a way nobody asked for, so the offset gives way instead. The rule, in
 * full:
 *
 *  1. Each prayer's requested time is its calculated time plus its offset.
 *  2. That time is then capped into the window between its neighbours'
 *     CALCULATED times, leaving one minute clear at each end. This is what
 *     stops Asr +30 landing on Maghrib — and it caps the prayer that moved,
 *     never the neighbour, because the neighbour's time is the mosque's
 *     ruling, not this user's preference.
 *  3. Two neighbouring offsets can still point at each other (Asr +30 and
 *     Maghrib −30 across a forty-minute gap): each passes step 2 against the
 *     other's calculated time and they still meet. A final forward pass
 *     resolves that in chronological order — the earlier prayer keeps the
 *     place step 2 gave it, and the later one is held one minute after it.
 *
 * What this does NOT do is invent an order the calculation never had. Inside
 * the polar night the engine can itself return Asr after Maghrib — at 68°N in
 * early December the two come out seventeen hours apart, the wrong way round —
 * and step 3 deliberately skips any pair the calculation already left with
 * less than a minute between them. Straightening that out is the engine's
 * business and the same on the website; a personal offset quietly repairing
 * it here would only hide it, and would mean the app and the website disagree
 * for a user who set no offsets at all.
 *
 * Consequence worth stating: a prayer left at offset 0 never moves, on any
 * day, anywhere. Step 2's window always contains the prayer's own calculated
 * time, and step 3 cannot reach it, because on a properly spaced pair step 2
 * has already capped the prayer before it to at least one minute earlier.
 * Only a prayer the user adjusted himself can end up somewhere he did not ask
 * for, and `capped` flags it when it does.
 *
 * Note also what does NOT happen: offsets do not propagate. The engine puts
 * Isha ninety minutes after the CALCULATED Maghrib; nudging Maghrib by five
 * minutes does not drag Isha along with it. If the masjid moved both, the
 * user sets both. Deriving one from the other would let a personal preference
 * quietly re-decide the mosque's ruling.
 */
export function applyPrefsDetailed(
  times: Record<PrayerName, Date>,
  prefs: PrayerPrefs,
): AdjustedDay {
  const order = PRAYER_ORDER;
  const base = order.map((p) => times[p].getTime());
  const requested = order.map((p, i) => {
    const offset = clampOffset(prefs.offsets[p] ?? 0);
    return base[i] + offset * MS_PER_MINUTE;
  });

  // Step 2 — cap into the window between the calculated neighbours.
  //
  // Both bounds are widened to include the prayer's own calculated time, so
  // the window always contains it. That is what makes a zero offset an exact
  // identity even on a day the engine itself left disordered (see step 3).
  //
  // A neighbour that is not a real instant contributes no bound at all. Above
  // 66°N the engine returns an Invalid Date for Fajr, Maghrib and Isha through
  // the midnight-sun weeks, while Dhuhr and Asr stay perfectly computable — and
  // an uncomputable neighbour must not drag a computable prayer into NaN with
  // it. An uncomputable prayer is passed through untouched: this file reports
  // what the engine said, it does not invent a time the calculation refused.
  const resolved = requested.map((want, i) => {
    if (!Number.isFinite(base[i])) return base[i];
    const prev = i > 0 ? base[i - 1] : Number.NaN;
    const next = i < order.length - 1 ? base[i + 1] : Number.NaN;
    const lower = Number.isFinite(prev)
      ? Math.min(base[i], prev + MIN_GAP_MS)
      : -Infinity;
    const upper = Number.isFinite(next)
      ? Math.max(base[i], next - MIN_GAP_MS)
      : Infinity;
    return Math.min(upper, Math.max(lower, want));
  });

  // Step 3 — chronological tie-break, but only between two prayers the
  // calculation itself put in order with room to spare.
  for (let i = 1; i < resolved.length; i++) {
    if (!Number.isFinite(base[i]) || !Number.isFinite(base[i - 1])) continue;
    if (base[i] - base[i - 1] < MIN_GAP_MS) continue;
    const floor = resolved[i - 1] + MIN_GAP_MS;
    if (resolved[i] < floor) resolved[i] = floor;
  }

  const out: AdjustedDay = {
    times: {} as Record<PrayerName, Date>,
    applied: {} as Record<PrayerName, number>,
    capped: {} as Record<PrayerName, boolean>,
  };
  order.forEach((p, i) => {
    out.times[p] = new Date(resolved[i]);
    const moved = Number.isFinite(resolved[i]) && Number.isFinite(base[i]);
    out.applied[p] = moved
      ? Math.round((resolved[i] - base[i]) / MS_PER_MINUTE)
      : 0;
    out.capped[p] = moved && resolved[i] !== requested[i];
  });
  return out;
}

/** The engine's times with this user's offsets applied. Pure: no clock, no
 *  storage, and the input is never mutated. */
export function applyPrefs(
  times: Record<PrayerName, Date>,
  prefs: PrayerPrefs,
): Record<PrayerName, Date> {
  return applyPrefsDetailed(times, prefs).times;
}

// ---------------------------------------------------------- what to schedule
//
// Pure as well, so the scheduler in notifications.ts stays a loop over a list
// someone else decided. It is handed ADJUSTED times — run applyPrefs first.

export interface PrayerAlert {
  prayer: NotifiedPrayer;
  /** "adhan" fires at the prayer, "reminder" the agreed minutes before it. */
  kind: "adhan" | "reminder";
  at: Date;
  /** Never "off": a prayer switched off produces no alerts at all. */
  style: Exclude<NotificationStyle, "off">;
  /** Only on reminders — how long before the adhan this fires. */
  minutesBefore?: number;
}

/**
 * Every alert a day's prayers should produce, in time order, past ones dropped.
 *
 * Two rules worth naming:
 *
 * - `"off"` silences the reminder too. Off means "do not tell me about this
 *   prayer", and a reminder for a prayer that was switched off is a bug, not
 *   a feature. Someone who wants the warning but not the call sets "silent".
 * - A reminder never plays the full adhan. Being called to prayer ten minutes
 *   early is worse than not being warned at all, so "adhan" degrades to
 *   "beep" for the reminder while "silent" stays silent.
 */
export function planAlerts(
  adjusted: Record<PrayerName, Date>,
  prefs: PrayerPrefs,
  now: Date = new Date(),
): PrayerAlert[] {
  const from = now.getTime();
  const alerts: PrayerAlert[] = [];

  for (const prayer of NOTIFIED_PRAYERS) {
    const style = prefs.notify[prayer] ?? DEFAULT_NOTIFICATION_STYLE;
    if (style === "off") continue;

    const at = adjusted[prayer];
    if (at.getTime() > from) {
      alerts.push({ prayer, kind: "adhan", at: new Date(at.getTime()), style });
    }

    const minutesBefore = clampReminder(prefs.reminderMinutes[prayer] ?? null);
    if (minutesBefore === null) continue;

    const warnAt = at.getTime() - minutesBefore * MS_PER_MINUTE;
    if (warnAt <= from) continue;
    alerts.push({
      prayer,
      kind: "reminder",
      at: new Date(warnAt),
      style: style === "adhan" ? "beep" : style,
      minutesBefore,
    });
  }

  return alerts.sort((a, b) => a.at.getTime() - b.at.getTime());
}
