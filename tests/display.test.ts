import { describe, expect, it } from "vitest";

import {
  clockOn,
  DISPLAY_PHOTO_META,
  displayTimes,
  isFriday,
  nightDimAt,
  parseClock,
  PHOTO_CYCLE_S,
  PHOTO_SHOW_S,
  photoAt,
  prayerNowAt,
  SAYINGS,
  SAYINGS_FRIDAY,
  sayingAt,
  sayingMarks,
} from "@/lib/display";
import { computeDay } from "@shared/prayer-engine";

const MARL = { lat: 51.6564, lng: 7.0907 };
// 2026-09-18 is a Friday, 2026-09-19 a Saturday.
const FRIDAY = new Date(2026, 8, 18, 10, 0, 0);
const SATURDAY = new Date(2026, 8, 19, 10, 0, 0);

describe("parseClock", () => {
  it("accepts HH:MM in ASCII and Arabic-Indic digits", () => {
    expect(parseClock("14:00")).toEqual({ h: 14, m: 0 });
    expect(parseClock(" 9:30 ")).toEqual({ h: 9, m: 30 });
    expect(parseClock("١٤:٠٠")).toEqual({ h: 14, m: 0 });
    expect(parseClock("13.45")).toEqual({ h: 13, m: 45 });
  });
  it("rejects nonsense", () => {
    expect(parseClock("")).toBeNull();
    expect(parseClock("14")).toBeNull();
    expect(parseClock("25:00")).toBeNull();
    expect(parseClock("14:60")).toBeNull();
    expect(parseClock("soon")).toBeNull();
  });
});

describe("displayTimes", () => {
  it("relabels nothing on a weekday", () => {
    const raw = computeDay(MARL.lat, MARL.lng, SATURDAY).primary.times;
    const r = displayTimes(raw, SATURDAY, "14:00");
    expect(r.jumua).toBe(false);
    expect(r.times).toBe(raw);
  });

  it("swaps Dhuhr for the Jumuʿa time on Friday when one is set", () => {
    const raw = computeDay(MARL.lat, MARL.lng, FRIDAY).primary.times;
    const r = displayTimes(raw, FRIDAY, "14:00");
    expect(r.jumua).toBe(true);
    expect(r.times.dhuhr.getHours()).toBe(14);
    expect(r.times.dhuhr.getMinutes()).toBe(0);
    expect(r.times.dhuhr.getDate()).toBe(18);
    expect(r.times.asr).toBe(raw.asr);
  });

  it("keeps the astronomical Dhuhr on Friday when no time is set", () => {
    const raw = computeDay(MARL.lat, MARL.lng, FRIDAY).primary.times;
    const r = displayTimes(raw, FRIDAY, "");
    expect(r.jumua).toBe(true);
    expect(r.times.dhuhr).toBe(raw.dhuhr);
  });

  it("helpers agree with the calendar", () => {
    expect(isFriday(FRIDAY)).toBe(true);
    expect(isFriday(SATURDAY)).toBe(false);
    const d = clockOn(FRIDAY, { h: 7, m: 5 });
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([7, 5, 0]);
  });
});

describe("sayingAt", () => {
  it("cycles through the right list at the period", () => {
    const t0 = new Date(2026, 0, 1, 0, 0, 0);
    const seen = new Set<string>();
    for (let i = 0; i < SAYINGS.length; i++) {
      seen.add(sayingAt(new Date(t0.getTime() + i * 12_000), false).text);
    }
    expect(seen.size).toBe(SAYINGS.length);
    expect(SAYINGS_FRIDAY).toContain(sayingAt(t0, true));
    // Same slot, same saying — no flicker between renders.
    expect(sayingAt(t0, false)).toBe(sayingAt(new Date(t0.getTime() + 1000), false));
  });
});

describe("wall behaviours", () => {
  it("marks Qurʾān with muṣḥaf brackets and nothing else", () => {
    expect(sayingMarks({ kind: "quran", text: "" })).toEqual({ open: "﴿", close: "﴾" });
    expect(sayingMarks({ kind: "hadith", text: "" })).toEqual({ open: "«", close: "»" });
    expect(sayingMarks({ kind: "dhikr", text: "" })).toEqual({ open: "◆", close: "◆" });
  });

  it("takes over for two minutes after a prayer enters, then yields", () => {
    const raw = computeDay(MARL.lat, MARL.lng, SATURDAY).primary.times;
    const t = raw.asr.getTime();
    expect(prayerNowAt(raw, new Date(t - 1000))).toBeNull();
    expect(prayerNowAt(raw, new Date(t))).toBe("asr");
    expect(prayerNowAt(raw, new Date(t + 119_000))).toBe("asr");
    expect(prayerNowAt(raw, new Date(t + 121_000))).toBeNull();
  });

  it("dims the panel in the dead of night", () => {
    expect(nightDimAt(new Date(2026, 0, 1, 2))).toBe(0.45);
    expect(nightDimAt(new Date(2026, 0, 1, 5))).toBe(0.28);
    expect(nightDimAt(new Date(2026, 0, 1, 23))).toBe(0.28);
    expect(nightDimAt(new Date(2026, 0, 1, 14))).toBe(0);
  });

  it("shows one photo per cycle, briefly, and rotates its lines", () => {
    const photos = DISPLAY_PHOTO_META;
    const base = PHOTO_CYCLE_S * photos.length * 10; // a slot boundary
    const at = (s: number) => new Date((base + s) * 1000);
    expect(photoAt(at(0), photos).active).toBe(true);
    expect(photoAt(at(PHOTO_SHOW_S + 1), photos).active).toBe(false);
    const seen = new Set<number>();
    for (let i = 0; i < photos.length; i++) {
      seen.add(photos.indexOf(photoAt(at(i * PHOTO_CYCLE_S), photos).photo));
    }
    expect(seen.size).toBe(photos.length);
    // Next time the first photo comes round, its next line shows.
    const first = photoAt(at(0), photos);
    const again = photoAt(at(photos.length * PHOTO_CYCLE_S), photos);
    expect(again.photo).toBe(first.photo);
    expect(again.line).not.toBe(first.line);
  });
});
