// A whole month of prayer times, computed once and kept.
//
// PRICE OF A MONTH. `computeDay` runs the primary method plus six alternates
// for the consensus badge, so a 31-day month is 217 `PrayerTimes`
// constructions. Measured on desktop V8 (node, Marl coordinates, twelve
// months, median of the run): 1.5 ms for the whole month including the Hijri
// conversion and the clock strings — 0.043 ms per day. Hermes on a mid-range
// Android is the slower engine, call it five to ten times that, so a month
// costs somewhere around 8-15 ms: one dropped frame when you tap "next",
// nothing at all while scrolling.
//
// That is cheap enough not to need a worker and expensive enough not to want
// it on every render, which is what this cache is for: tapping back and forth
// between two months must not recompute either of them, and the screen
// prefetches its neighbours after the interaction so the tap itself is free.
//
// The result is a plain, frozen-in-practice object graph: every row is built
// once and handed to a memoised row component, so scrolling re-renders
// nothing. Strings are formatted here rather than in render for the same
// reason — 31 rows x 6 cells is 186 `formatClock` calls, and they should
// happen once per month, not once per frame.

import { computeDay, PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";
import { toHijri, type HijriDate } from "@/lib/hijri";
import { formatClock } from "@/lib/time";

import { FRIDAY } from "./calendar-names";

export interface MonthDay {
  /** Local midnight, the date the times were calculated for. */
  date: Date;
  /** Day of the Gregorian month, 1-31. */
  day: number;
  /** 0 = Sunday … 6 = Saturday, as `Date#getDay`. */
  weekday: number;
  isFriday: boolean;
  /** Umm al-Qura date, or null outside the embedded table. */
  hijri: HijriDate | null;
  /** "HH:MM" per prayer, already formatted. */
  times: Record<PrayerName, string>;
}

export interface MonthTable {
  year: number;
  /** 0-11, as `Date#getMonth`. */
  month: number;
  days: MonthDay[];
  /**
   * The Hijri months this Gregorian month touches, in order. Normally two,
   * one when a Hijri month happens to start on the 1st, empty when the whole
   * month falls outside the Umm al-Qura table.
   */
  hijriSpan: { year: number; month: number }[];
}

/** Days in a Gregorian month. Day 0 of the next month is the last of this one. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Cache key.
 *
 * Coordinates are rounded to four decimals — about 11 m — so that GPS jitter
 * does not throw the month away and recompute it. Prayer times do not move
 * measurably over 11 m; the nearest neighbour's answer is this one's.
 */
function cacheKey(
  year: number,
  month: number,
  latitude: number,
  longitude: number,
): string {
  return `${year}-${month}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
}

// Small LRU. A `Map` iterates in insertion order, so the oldest key is the
// first one. Eight months is a year of back-and-forth browsing and a few
// hundred kilobytes at most.
const CACHE_LIMIT = 8;
const cache = new Map<string, MonthTable>();

/**
 * Build (or fetch) the timetable for one Gregorian month.
 *
 * Pure and synchronous: safe to call from `useMemo`, from an effect, or from
 * `InteractionManager.runAfterInteractions` to warm a neighbouring month.
 */
export function buildMonth(
  year: number,
  month: number,
  latitude: number,
  longitude: number,
): MonthTable {
  const key = cacheKey(year, month, latitude, longitude);
  const hit = cache.get(key);
  if (hit) {
    // Touch: re-inserting moves it to the young end of the map.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const count = daysInMonth(year, month);
  const days: MonthDay[] = [];
  const hijriSpan: { year: number; month: number }[] = [];

  for (let day = 1; day <= count; day++) {
    const date = new Date(year, month, day);
    const computed = computeDay(latitude, longitude, date).primary.times;

    // The Hijri date is ornament next to the times; out of range it throws,
    // and losing the ornament must not take the timetable down with it.
    let hijri: HijriDate | null = null;
    try {
      hijri = toHijri(date);
    } catch {
      hijri = null;
    }

    if (hijri) {
      const last = hijriSpan[hijriSpan.length - 1];
      if (!last || last.year !== hijri.year || last.month !== hijri.month) {
        hijriSpan.push({ year: hijri.year, month: hijri.month });
      }
    }

    const times = {} as Record<PrayerName, string>;
    for (const prayer of PRAYER_ORDER) times[prayer] = formatClock(computed[prayer]);

    days.push({
      date,
      day,
      weekday: date.getDay(),
      isFriday: date.getDay() === FRIDAY,
      hijri,
      times,
    });
  }

  const table: MonthTable = { year, month, days, hijriSpan };

  cache.set(key, table);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }

  return table;
}

/** Step a (year, month) pair by whole months, rolling the year over. */
export function shiftMonth(
  year: number,
  month: number,
  by: number,
): { year: number; month: number } {
  const total = year * 12 + month + by;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}
