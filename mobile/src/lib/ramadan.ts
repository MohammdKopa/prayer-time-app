// Ramadan mode.
//
// Auto-activates purely from the Hijri calendar — no setting, nothing to
// forget to turn on or off. `isRamadan`/`ramadanDay` read the Umm al-Qura
// month via `toHijri` (see hijri.ts); `fastingWindow`/`fastingCountdown` read
// the day's already-computed prayer times.
//
// imsak = the shown Fajr time, exactly. The mosque's fixed Fajr offset (see
// prayer-adjust) already carries the imam's ruling on when the fast begins;
// subtracting an extra caution buffer here would second-guess a decision
// that is already baked into the time on screen. Two clocks disagreeing
// about when the fast starts is worse than one clock being a few minutes
// more cautious than a user expected.
//
// iftar = Maghrib, likewise unmodified.

import type { PrayerName } from "@shared/prayer-engine";
import { toHijri } from "@/lib/hijri";
import { countdownTo, formatCountdown, isValidTime, type Countdown } from "@/lib/time";

const RAMADAN_MONTH = 9;

/**
 * Dev-only override so Ramadan mode can be exercised outside Ramadan without
 * a settings toggle. Never persisted, never surfaced in the UI — set it from
 * a debugger console (`__setDebugRamadanOverride(true)`) and nothing else in
 * the app reads or writes it. `null` (the default) defers to the real
 * calendar.
 */
let debugOverride: boolean | null = null;

export function __setDebugRamadanOverride(value: boolean | null): void {
  debugOverride = value;
}

/**
 * True when `date` falls in Ramadan on the Umm al-Qura calendar.
 *
 * A date outside the tabulated Hijri range (see {@link HIJRI_RANGE} in
 * hijri.ts) is treated as "not Ramadan" rather than thrown — losing the
 * Ramadan card over a date centuries away must not take the Times screen
 * down with it.
 */
export function isRamadan(date: Date): boolean {
  if (debugOverride !== null) return debugOverride;
  try {
    return toHijri(date).month === RAMADAN_MONTH;
  } catch {
    return false;
  }
}

/** 1-30 within Ramadan, or null outside it (or outside the tabulated range). */
export function ramadanDay(date: Date): number | null {
  if (debugOverride !== null) {
    if (!debugOverride) return null;
    try {
      return toHijri(date).day;
    } catch {
      return 1;
    }
  }
  try {
    const h = toHijri(date);
    return h.month === RAMADAN_MONTH ? h.day : null;
  } catch {
    return null;
  }
}

export interface FastingWindow {
  imsak: Date;
  iftar: Date;
}

/**
 * Today's fasting window, read straight off the day's prayer times.
 *
 * imsak = Fajr, iftar = Maghrib — both exactly as computed/adjusted
 * elsewhere, never recomputed here.
 */
export function fastingWindow(times: Record<PrayerName, Date>): FastingWindow {
  return { imsak: times.fajr, iftar: times.maghrib };
}

export type FastingTarget = "imsak" | "iftar";

export interface FastingCountdown {
  target: FastingTarget;
  countdown: Countdown;
  /** `formatCountdown(countdown)` — 0-9, same as every other clock on
   *  screen, in every language. */
  formatted: string;
}

/**
 * Which half of the fast `now` is in, and the countdown to the next edge.
 *
 * Before imsak: counting down to imsak. Between imsak and iftar: counting
 * down to iftar. At or after iftar: null — today's fast is over, and
 * tomorrow's imsak is a different day's window, not this one's.
 *
 * Returns null if either time is an Invalid Date (see {@link isValidTime}) —
 * a caller above ~66N during the midnight-sun weeks should skip the card
 * rather than count down to NaN.
 */
export function fastingCountdown(
  now: Date,
  times: Record<PrayerName, Date>,
): FastingCountdown | null {
  const { imsak, iftar } = fastingWindow(times);
  if (!isValidTime(imsak) || !isValidTime(iftar)) return null;

  const target: FastingTarget | null =
    now.getTime() < imsak.getTime()
      ? "imsak"
      : now.getTime() < iftar.getTime()
        ? "iftar"
        : null;
  if (!target) return null;

  const countdown = countdownTo(target === "imsak" ? imsak : iftar, now);
  return { target, countdown, formatted: formatCountdown(countdown) };
}
