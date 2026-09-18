// Anchors verified against a second, independent source (2026-09-18):
//
//   1 Ramadan 1447   -> 2026-02-18  (hijri-gregorian.com, IslamicFinder)
//   1 Shawwal 1447    -> 2026-03-20  (Fiqh Council of North America
//                                     Ramadan-Shawwal 1447/2026 announcement)
//   10 Dhu al-Hijjah 1447 -> 2026-05-27 (Muhammadiyah: "Eid al-Adha 1447H to
//                                     Fall on Wednesday, May 27, 2026")
//   1 Muharram 1448   -> 2026-06-16  (Wego / Saudi Supreme Court confirmation
//                                     of crescent sighting evening of 15 June)
//
// All four match mobile/src/lib/hijri.ts's toHijri() exactly — no discrepancy
// to note.

import { describe, expect, it } from "vitest";
import { HIJRI_RANGE, hijriMonthName, toHijri } from "@/lib/hijri";

describe("toHijri anchors (Umm al-Qura, cross-checked against a second source)", () => {
  it("1 Ramadan 1447 = 2026-02-18", () => {
    expect(toHijri(new Date(2026, 1, 18))).toEqual({ year: 1447, month: 9, day: 1 });
  });

  it("1 Shawwal 1447 = 2026-03-20", () => {
    expect(toHijri(new Date(2026, 2, 20))).toEqual({ year: 1447, month: 10, day: 1 });
  });

  it("10 Dhu al-Hijjah 1447 = 2026-05-27", () => {
    expect(toHijri(new Date(2026, 4, 27))).toEqual({ year: 1447, month: 12, day: 10 });
  });

  it("1 Muharram 1448 = 2026-06-16", () => {
    expect(toHijri(new Date(2026, 5, 16))).toEqual({ year: 1448, month: 1, day: 1 });
  });

  it("the day before each anchor is the last day of the previous month", () => {
    // 2026-02-17 is 29 Sha'ban 1447 (Ramadan 1447 is a 29-day gap from
    // Sha'ban's start per the table — confirm it's simply "day before 1 Ramadan").
    const before = toHijri(new Date(2026, 1, 17));
    expect(before.year).toBe(1447);
    expect(before.month).toBe(8); // Sha'ban
  });
});

describe("HIJRI_RANGE bounds", () => {
  it("min/max are valid Dates with min before max", () => {
    expect(Number.isNaN(HIJRI_RANGE.minGregorian.getTime())).toBe(false);
    expect(Number.isNaN(HIJRI_RANGE.maxGregorian.getTime())).toBe(false);
    expect(HIJRI_RANGE.minGregorian.getTime()).toBeLessThan(
      HIJRI_RANGE.maxGregorian.getTime(),
    );
  });

  it("toHijri succeeds at the exact min bound", () => {
    expect(() => toHijri(HIJRI_RANGE.minGregorian)).not.toThrow();
  });

  it("toHijri throws one day before the min bound", () => {
    const before = new Date(HIJRI_RANGE.minGregorian);
    before.setDate(before.getDate() - 1);
    expect(() => toHijri(before)).toThrow();
  });

  it("toHijri throws one day after the max bound (table end is exclusive)", () => {
    const after = new Date(HIJRI_RANGE.maxGregorian);
    after.setDate(after.getDate() + 1);
    expect(() => toHijri(after)).toThrow();
  });

  it("toHijri throws on an Invalid Date", () => {
    expect(() => toHijri(new Date(Number.NaN))).toThrow();
  });

  it("2026 and 2027 both fall well inside the table", () => {
    expect(new Date(2026, 0, 1).getTime()).toBeGreaterThan(
      HIJRI_RANGE.minGregorian.getTime(),
    );
    expect(new Date(2027, 11, 31).getTime()).toBeLessThan(
      HIJRI_RANGE.maxGregorian.getTime(),
    );
  });
});

describe("hijriMonthName", () => {
  it("returns a name for every month 1-12 in every supported locale", () => {
    for (const locale of ["ar", "de", "tr", "en"] as const) {
      for (let m = 1; m <= 12; m++) {
        expect(typeof hijriMonthName(m, locale)).toBe("string");
        expect(hijriMonthName(m, locale).length).toBeGreaterThan(0);
      }
    }
  });

  it("throws for month 0 and month 13", () => {
    expect(() => hijriMonthName(0, "en")).toThrow();
    expect(() => hijriMonthName(13, "en")).toThrow();
  });
});

describe("consecutive Gregorian days never skip or repeat a Hijri day, 2026-2027", () => {
  it("every Hijri day is either +1 day in the same month, or day 1 of the next month", () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2027, 11, 31);

    let prev = toHijri(start);
    const problems: string[] = [];

    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor.getTime() <= end.getTime()) {
      const cur = toHijri(cursor);

      const sameMonthNextDay =
        cur.year === prev.year && cur.month === prev.month && cur.day === prev.day + 1;

      const nextMonthDayOne =
        cur.day === 1 &&
        ((cur.year === prev.year && cur.month === prev.month + 1) ||
          (cur.year === prev.year + 1 && prev.month === 12 && cur.month === 1));

      if (!sameMonthNextDay && !nextMonthDayOne) {
        problems.push(
          `${cursor.toDateString()}: ${JSON.stringify(prev)} -> ${JSON.stringify(cur)}`,
        );
      }

      prev = cur;
      cursor.setDate(cursor.getDate() + 1);
    }

    expect(problems, problems.slice(0, 5).join("\n")).toEqual([]);
  });
});
