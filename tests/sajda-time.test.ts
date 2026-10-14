import { describe, expect, it } from "vitest";

import { computeDay } from "@shared/prayer-engine";
import {
  SUN_RISEN_MINUTES,
  ZENITH_MINUTES,
  isSajdaAyah,
  restrictedWindow,
} from "@/lib/quran/sajda-time";

// Marl, a mid-October day: Fajr ~05:40, sunrise ~07:55, Dhuhr ~13:30,
// Asr ~16:20, Maghrib ~18:50, all local. The tests read the real times from
// the engine rather than hard-coding them, and probe a minute either side.
const MARL = { lat: 51.6567, lon: 7.0905 };
const day = new Date(2026, 9, 14);
const times = computeDay(MARL.lat, MARL.lon, day).primary.times;
const at = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

describe("restricted windows for the sajda note", () => {
  it("after Fajr comes in, until the sun has risen", () => {
    expect(restrictedWindow(at(times.fajr, -1), times)).toBeNull();
    const w = restrictedWindow(at(times.fajr, 1), times);
    expect(w?.kind).toBe("afterFajr");
    expect(w?.until).toEqual(at(times.sunrise, SUN_RISEN_MINUTES));
  });

  it("while the sun is rising", () => {
    expect(restrictedWindow(at(times.sunrise, 1), times)?.kind).toBe("sunrise");
    expect(restrictedWindow(at(times.sunrise, SUN_RISEN_MINUTES + 1), times)).toBeNull();
  });

  it("at the zenith, just before Dhuhr", () => {
    expect(restrictedWindow(at(times.dhuhr, -ZENITH_MINUTES - 1), times)).toBeNull();
    expect(restrictedWindow(at(times.dhuhr, -1), times)?.kind).toBe("zenith");
    expect(restrictedWindow(at(times.dhuhr, 1), times)).toBeNull();
  });

  it("from ʿAṣr until Maghrib", () => {
    expect(restrictedWindow(at(times.asr, -1), times)).toBeNull();
    const w = restrictedWindow(at(times.asr, 1), times);
    expect(w?.kind).toBe("afterAsr");
    expect(w?.until).toEqual(times.maghrib);
    expect(restrictedWindow(at(times.maghrib, 1), times)).toBeNull();
  });

  it("never between Isha and Fajr", () => {
    expect(restrictedWindow(at(times.isha, 30), times)).toBeNull();
  });
});

describe("āyāt of prostration", () => {
  it("knows the fifteen", () => {
    expect(isSajdaAyah(7, 206)).toBe(true);
    expect(isSajdaAyah(96, 19)).toBe(true);
    expect(isSajdaAyah(2, 255)).toBe(false);
  });
});
