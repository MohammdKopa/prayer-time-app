// Locale-agnostic time formatting.
//
// Deliberately does NOT use Intl. Hermes' Intl support varies by Android
// version and fails quietly rather than throwing — the same trap that makes
// shared/format.ts unsafe to use here for Hijri dates. Clock times are simple
// enough to format by hand, so we do, and the output is identical on every
// device.
//
// Translated strings do not belong in this file. It returns numbers and
// structure; the i18n layer turns those into words.

/** True when a Date actually carries a time. */
export function isValidTime(d: Date): boolean {
  return Number.isFinite(d.getTime());
}

/**
 * Shown in place of a time the engine could not compute.
 *
 * Above roughly 66°N the sun does not cross the horizon for weeks at a time
 * and Fajr, sunrise, Maghrib and Isha have no solution — the engine returns an
 * Invalid Date. Germany never hits this (verified: zero occurrences up to
 * 60°N across a full year), but the app follows GPS, so a traveller can.
 * Principle #4 again: say nothing rather than print NaN.
 */
export const NO_TIME = "—";

/** Zero-padded 24-hour clock, e.g. "05:31". */
export function formatClock(d: Date): string {
  if (!isValidTime(d)) return NO_TIME;
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/** Zero-padded with seconds, e.g. "05:31:07". */
export function formatClockWithSeconds(d: Date): string {
  if (!isValidTime(d)) return NO_TIME;
  return `${formatClock(d)}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
  /** Total milliseconds remaining; negative once the moment has passed. */
  remainingMs: number;
}

export function countdownTo(target: Date, now: Date = new Date()): Countdown {
  const remainingMs = target.getTime() - now.getTime();
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    remainingMs,
  };
}

/** "1:23:45" or "23:45" — no words, so it reads the same in every language. */
export function formatCountdown(c: Countdown): string {
  const mm = String(c.minutes).padStart(2, "0");
  const ss = String(c.seconds).padStart(2, "0");
  return c.hours > 0 ? `${c.hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * Convert ASCII digits to Arabic-Indic. Applied at render time only, never to
 * stored values, so nothing downstream has to parse them back.
 */
export function toArabicIndic(s: string): string {
  return s.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}
