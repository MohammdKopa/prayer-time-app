// Annual Islamic dates and when they next fall.
//
// Every date here is fixed on the Hijri calendar, not the Gregorian one, so
// "when is it" is a real question each year. hijri.ts has toHijri but no
// inverse — there is no closed-form Hijri-to-Gregorian conversion over the
// tabulated Umm al-Qura data, only a lookup the other way. So this file
// answers the question the cheap way: walk the calendar forward one day at a
// time and ask toHijri what day it is. A year of that is under 400 iterations
// of an array lookup and a binary search each — irrelevant next to a single
// re-render, and it stays exactly consistent with the table hijri.ts already
// commits to.

import { HIJRI_RANGE, toHijri, type HijriDate } from "@/lib/hijri";
import type { StringKey } from "@/lib/i18n/strings";

/** One annually-recurring Islamic date. `month`/`day` are Hijri, 1-12/1-30. */
export interface IslamicEvent {
  /** i18n key for the event's display name. */
  key: StringKey;
  month: number;
  day: number;
  /**
   * Set where scholars differ on whether — or how — the date is marked
   * (Mawlid, Nisf Sha'ban) or on which night it actually falls (27 Ramadan is
   * the commonly observed date for Laylat al-Qadr, not a certain one). The
   * screen shows a note rather than presenting these as settled.
   */
  observance?: true;
}

export const ISLAMIC_EVENTS: readonly IslamicEvent[] = [
  { key: "eventIslamicNewYear", month: 1, day: 1 },
  { key: "eventAshura", month: 1, day: 10 },
  { key: "eventMawlid", month: 3, day: 12, observance: true },
  { key: "eventIsraMiraj", month: 7, day: 27 },
  { key: "eventNisfShaban", month: 8, day: 15, observance: true },
  { key: "eventRamadanStart", month: 9, day: 1 },
  { key: "eventLaylatAlQadr", month: 9, day: 27, observance: true },
  { key: "eventEidAlFitr", month: 10, day: 1 },
  { key: "eventArafah", month: 12, day: 9 },
  { key: "eventEidAlAdha", month: 12, day: 10 },
  { key: "eventTashreeqEnd", month: 12, day: 13 },
];

export interface UpcomingEvent {
  event: IslamicEvent;
  gregorian: Date;
  hijri: HijriDate;
  /** Whole calendar days from the `from` passed to {@link upcomingEvents}. */
  daysAway: number;
}

/**
 * How far forward to scan looking for occurrences. A Hijri year is roughly
 * 354 days, so 400 days is guaranteed to complete one full cycle of every
 * annual date — including one that fell the day before `from` — with room to
 * spare, at negligible cost.
 */
const SCAN_HORIZON_DAYS = 400;

/**
 * The next occurrence of each entry in {@link ISLAMIC_EVENTS}, on or after
 * `from`, nearest first.
 *
 * Defaults to one of each — a full annual cycle — which is also what "the
 * next 12 months" comes out to, since every entry recurs about once a year.
 * Pass `count` to ask for more (repeats appear once their next occurrence
 * comes back around within the scan horizon) or fewer.
 *
 * Days outside {@link HIJRI_RANGE} are skipped rather than passed to
 * `toHijri`, which would throw — a caller scanning near the edge of the
 * table gets whatever occurrences exist inside it instead of a crash.
 */
export function upcomingEvents(
  from: Date,
  count: number = ISLAMIC_EVENTS.length,
): UpcomingEvent[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const minMs = HIJRI_RANGE.minGregorian.getTime();
  const maxMs = HIJRI_RANGE.maxGregorian.getTime();

  const results: UpcomingEvent[] = [];

  for (let offset = 0; offset <= SCAN_HORIZON_DAYS && results.length < count; offset++) {
    const day = new Date(start);
    day.setDate(day.getDate() + offset);
    if (day.getTime() < minMs || day.getTime() > maxMs) continue;

    const hijri = toHijri(day);
    for (const event of ISLAMIC_EVENTS) {
      if (event.month === hijri.month && event.day === hijri.day) {
        results.push({ event, gregorian: day, hijri, daysAway: offset });
      }
    }
  }

  // Built in increasing offset order already, but the inner loop can add more
  // than one match for the same day (harmless — no two entries above share a
  // month/day — kept only in case that ever changes) so sort defensively.
  results.sort((a, b) => a.gregorian.getTime() - b.gregorian.getTime());
  return results.slice(0, count);
}
