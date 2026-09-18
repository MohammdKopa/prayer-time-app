// Golden-file + invariant tests for shared/prayer-engine.ts.
//
// shared/ is not ours to modify (see the task that produced this file) — these
// tests only observe it. The golden values in tests/golden/engine.json were
// generated once via `npx tsx tests/golden/generate.mts` and independently
// checked against Aladhan (method=3 MWL/Shafi, latitudeAdjustmentMethod=2 —
// see tests/golden/generate.mts for the exact query and how to regenerate).
// Dhuhr/Asr/Maghrib/sunrise agreed within 120s at every point checked (worst
// case exactly 120s, on Asr at the spring equinox — still within tolerance).
//
// Fajr and Isha are not astronomical: the mosque's ruling (documented in
// shared/prayer-engine.ts) fixes them at sunrise-90min and maghrib+90min, so
// they are asserted structurally rather than pinned to a frozen value.

import { describe, expect, it } from "vitest";
import { computeDay, PRAYER_ORDER, type PrayerName } from "../shared/prayer-engine";
import golden from "./golden/engine.json";

type GoldenPrayer = "dhuhr" | "asr" | "maghrib" | "sunrise";
const GOLDEN_PRAYERS: GoldenPrayer[] = ["dhuhr", "asr", "maghrib", "sunrise"];

const CITIES = [
  { id: "marl", lat: 51.657, lng: 7.091 },
  { id: "berlin", lat: 52.52, lng: 13.405 },
  { id: "munich", lat: 48.137, lng: 11.575 },
];

const DATES = ["2026-03-20", "2026-06-21", "2026-09-17", "2026-12-21"];

function dateAtNoon(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

describe("engine golden values (frozen, validated against Aladhan)", () => {
  for (const city of CITIES) {
    for (const dateStr of DATES) {
      it(`${city.id} ${dateStr} matches the frozen golden for dhuhr/asr/maghrib/sunrise`, () => {
        const day = computeDay(city.lat, city.lng, dateAtNoon(dateStr));
        const expected = (golden as Record<string, Record<string, Record<string, string>>>)[
          city.id
        ][dateStr];

        for (const prayer of GOLDEN_PRAYERS) {
          expect(day.primary.times[prayer].toISOString()).toBe(expected[prayer]);
        }
      });
    }
  }
});

describe("mosque fixed-offset rules hold structurally (not by value)", () => {
  for (const city of CITIES) {
    for (const dateStr of DATES) {
      it(`${city.id} ${dateStr}: Isha = Maghrib + 90min, Fajr = sunrise - 90min`, () => {
        const day = computeDay(city.lat, city.lng, dateAtNoon(dateStr));
        const { fajr, sunrise, maghrib, isha } = day.primary.times;

        const ishaGapMin = (isha.getTime() - maghrib.getTime()) / 60_000;
        const fajrGapMin = (sunrise.getTime() - fajr.getTime()) / 60_000;

        expect(ishaGapMin).toBe(90);
        expect(fajrGapMin).toBe(90);
      });
    }
  }
});

// The 5 German cities from scripts/engine-parity.mts — Germany's latitude
// range from its northernmost served city to its southernmost.
const PARITY_SITES = [
  { name: "Flensburg", lat: 54.7837, lng: 9.4365 },
  { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  { name: "Marl", lat: 51.6564, lng: 7.0907 },
  { name: "Köln", lat: 50.9375, lng: 6.9603 },
  { name: "München", lat: 48.1351, lng: 11.582 },
];

describe("prayer order is monotonic every day of 2026 at all 5 served cities", () => {
  for (const site of PARITY_SITES) {
    it(`${site.name}: fajr < sunrise < dhuhr < asr < maghrib < isha, all 365 days`, () => {
      const start = new Date(2026, 0, 1, 12, 0, 0, 0);
      const brokenDays: string[] = [];

      for (let i = 0; i < 365; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const times = computeDay(site.lat, site.lng, date).primary.times;

        for (let k = 1; k < PRAYER_ORDER.length; k++) {
          const prev = times[PRAYER_ORDER[k - 1]];
          const cur = times[PRAYER_ORDER[k]];
          if (!(cur.getTime() > prev.getTime())) {
            brokenDays.push(
              `${date.toISOString().slice(0, 10)}: ${PRAYER_ORDER[k - 1]} (${prev.toISOString()}) not before ${PRAYER_ORDER[k]} (${cur.toISOString()})`,
            );
          }
        }
      }

      expect(brokenDays, brokenDays.slice(0, 5).join("\n")).toEqual([]);
    });
  }
});

// Germany's served latitude band. ROADMAP-MOBILE.md's "Known engine
// limitation — high latitude" section measured zero Invalid Date days
// anywhere up to 60N, and separately confirmed Marl/Hamburg/Flensburg (51.7N
// -55N) at zero. Munich anchors the southern end at ~48N. Eight points
// spanning 47.3N-55.0N (the widened range this test suite targets) with
// varied longitudes across the country.
const GERMANY_SAMPLE_POINTS = [
  { name: "south-west (Freiburg-ish)", lat: 47.3, lng: 7.85 },
  { name: "Munich", lat: 48.137, lng: 11.575 },
  { name: "Stuttgart-ish", lat: 48.78, lng: 9.18 },
  { name: "Frankfurt-ish", lat: 50.11, lng: 8.68 },
  { name: "Köln", lat: 50.9375, lng: 6.9603 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  { name: "Flensburg (northernmost)", lat: 55.0, lng: 9.4365 },
];

describe("no Invalid Date anywhere in Germany across 2026", () => {
  for (const point of GERMANY_SAMPLE_POINTS) {
    it(`${point.name} (${point.lat}N, ${point.lng}E): every prayer is a valid Date, all 365 days`, () => {
      const start = new Date(2026, 0, 1, 12, 0, 0, 0);
      const invalid: string[] = [];

      for (let i = 0; i < 365; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const times = computeDay(point.lat, point.lng, date).primary.times;

        for (const prayer of PRAYER_ORDER as readonly PrayerName[]) {
          if (Number.isNaN(times[prayer].getTime())) {
            invalid.push(`${date.toISOString().slice(0, 10)} ${prayer}`);
          }
        }
      }

      expect(invalid, invalid.slice(0, 5).join("\n")).toEqual([]);
    });
  }
});
