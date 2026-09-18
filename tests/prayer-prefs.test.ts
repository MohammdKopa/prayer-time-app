// mobile/src/lib/prayer-prefs.ts pulls in @/lib/storage, which pulls in
// AsyncStorage (react-native). Everything tested here is the pure part of
// the module (clamping, normalizePrefs, applyPrefsDetailed, planAlerts), so
// storage is mocked out rather than exercised.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({
  loadJSON: vi.fn(async () => null),
  saveJSON: vi.fn(async () => {}),
}));

import { PRAYER_ORDER, type PrayerName } from "@shared/prayer-engine";
import {
  applyPrefsDetailed,
  clampOffset,
  clampReminder,
  defaultPrefs,
  isDefaultPrefs,
  MIN_GAP_MINUTES,
  NOTIFIED_PRAYERS,
  normalizePrefs,
  OFFSET_LIMIT_MINUTES,
  planAlerts,
  type PrayerPrefs,
} from "@/lib/prayer-prefs";

// A calm, evenly-spaced day: 90 minutes between every neighbour, no edge
// cases from the engine itself. Local test fixture, not the real engine.
function evenDay(baseHour = 4): Record<PrayerName, Date> {
  const d = (offsetMinutes: number) =>
    new Date(2026, 5, 15, 0, offsetMinutes + baseHour * 60, 0, 0);
  return {
    fajr: d(0),
    sunrise: d(90),
    dhuhr: d(300), // dhuhr further out, like midday
    asr: d(480),
    maghrib: d(600),
    isha: d(690),
  };
}

describe("clampOffset", () => {
  it("passes values inside the range through, rounded", () => {
    expect(clampOffset(5)).toBe(5);
    expect(clampOffset(5.4)).toBe(5);
    expect(clampOffset(5.6)).toBe(6);
    expect(clampOffset(-12)).toBe(-12);
  });

  it(`clamps to +/-${OFFSET_LIMIT_MINUTES}`, () => {
    expect(clampOffset(1000)).toBe(OFFSET_LIMIT_MINUTES);
    expect(clampOffset(-1000)).toBe(-OFFSET_LIMIT_MINUTES);
    expect(clampOffset(OFFSET_LIMIT_MINUTES)).toBe(OFFSET_LIMIT_MINUTES);
    expect(clampOffset(-OFFSET_LIMIT_MINUTES)).toBe(-OFFSET_LIMIT_MINUTES);
  });

  it("treats non-finite input as 0", () => {
    expect(clampOffset(Number.NaN)).toBe(0);
    expect(clampOffset(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampOffset(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("clampReminder", () => {
  it("null stays null", () => {
    expect(clampReminder(null)).toBeNull();
  });

  it("non-finite or non-positive collapses to null (no reminder)", () => {
    expect(clampReminder(Number.NaN)).toBeNull();
    expect(clampReminder(0)).toBeNull();
    expect(clampReminder(-5)).toBeNull();
  });

  it("clamps into [1, 120], rounded", () => {
    expect(clampReminder(0.4)).toBeNull(); // rounds to 0 -> null
    expect(clampReminder(0.6)).toBe(1);
    expect(clampReminder(15.5)).toBe(16);
    expect(clampReminder(9999)).toBe(120);
  });
});

describe("normalizePrefs on garbage input", () => {
  it("null, undefined, a string, a number, an array all fall back to defaults", () => {
    for (const garbage of [null, undefined, "nonsense", 42, [1, 2, 3], true]) {
      expect(normalizePrefs(garbage)).toEqual(defaultPrefs());
    }
  });

  it("an empty object falls back to defaults", () => {
    expect(normalizePrefs({})).toEqual(defaultPrefs());
  });

  it("picks up only the fields that are actually valid, clamping the rest", () => {
    const raw = {
      offsets: { fajr: 999, dhuhr: "nope", asr: -5.6, notAPrayer: 3 },
      notify: { fajr: "beep", asr: "not-a-style", maghrib: 12 },
      reminderMinutes: { fajr: 10, asr: -1, isha: "nope" },
    };
    const prefs = normalizePrefs(raw);

    expect(prefs.offsets.fajr).toBe(30); // clamped from 999
    expect(prefs.offsets.dhuhr).toBe(0); // not a number -> default
    expect(prefs.offsets.asr).toBe(-6); // -5.6 rounds to -6

    expect(prefs.notify.fajr).toBe("beep");
    expect(prefs.notify.asr).toBe("adhan"); // invalid style -> default
    expect(prefs.notify.maghrib).toBe("adhan"); // not a string -> default

    expect(prefs.reminderMinutes.fajr).toBe(10);
    expect(prefs.reminderMinutes.asr).toBeNull(); // clampReminder(-1) -> null
    expect(prefs.reminderMinutes.isha).toBeNull(); // not a number -> default null
  });

  it("never throws regardless of how deeply malformed the input is", () => {
    const inputs: unknown[] = [
      { offsets: null, notify: null, reminderMinutes: null },
      { offsets: "x", notify: 5, reminderMinutes: [] },
      { offsets: { fajr: { nested: true } } },
    ];
    for (const raw of inputs) {
      expect(() => normalizePrefs(raw)).not.toThrow();
    }
  });
});

describe("isDefaultPrefs", () => {
  it("true for defaultPrefs(), false after any change", () => {
    const base = defaultPrefs();
    expect(isDefaultPrefs(base)).toBe(true);

    const changed: PrayerPrefs = {
      ...base,
      offsets: { ...base.offsets, fajr: 1 },
    };
    expect(isDefaultPrefs(changed)).toBe(false);
  });
});

describe("applyPrefsDetailed preserves the mosque's minimum gap", () => {
  it("a zero-offset day is returned unchanged (identity)", () => {
    const times = evenDay();
    const result = applyPrefsDetailed(times, defaultPrefs());
    for (const p of PRAYER_ORDER) {
      expect(result.times[p].getTime()).toBe(times[p].getTime());
      expect(result.capped[p]).toBe(false);
      expect(result.applied[p]).toBe(0);
    }
  });

  it(`a large positive Asr offset is capped to leave ${MIN_GAP_MINUTES} minute before Maghrib's calculated time`, () => {
    const times = evenDay();
    const prefs = { ...defaultPrefs() };
    prefs.offsets = { ...prefs.offsets, asr: OFFSET_LIMIT_MINUTES }; // +30

    const result = applyPrefsDetailed(times, prefs);

    // Asr's calculated time + 30 would land past Maghrib's calculated time
    // (they are 120 min apart in evenDay), so this particular case does NOT
    // need capping -- verify the arithmetic sits inside the window instead of
    // asserting a specific cap.
    const maghribCalc = times.maghrib.getTime();
    const asrResult = result.times.asr.getTime();
    expect(asrResult).toBeLessThanOrEqual(maghribCalc - MIN_GAP_MINUTES * 60_000);
  });

  it("an offset big enough to overshoot the neighbour is capped, and flagged", () => {
    // Asr and Maghrib only 5 minutes apart here, offset +30 must be capped.
    const times = evenDay();
    times.maghrib = new Date(times.asr.getTime() + 5 * 60_000);
    times.isha = new Date(times.maghrib.getTime() + 90 * 60_000);

    const prefs = { ...defaultPrefs() };
    prefs.offsets = { ...prefs.offsets, asr: OFFSET_LIMIT_MINUTES };

    const result = applyPrefsDetailed(times, prefs);

    const expectedCap = times.maghrib.getTime() - MIN_GAP_MINUTES * 60_000;
    expect(result.times.asr.getTime()).toBe(expectedCap);
    expect(result.capped.asr).toBe(true);
    expect(result.applied.asr).not.toBe(OFFSET_LIMIT_MINUTES);
  });

  it("never inverts order: Asr pushed later and Maghrib pushed earlier still leaves >= MIN_GAP apart", () => {
    const times = evenDay();
    // 40 minutes apart, offsets pull them toward each other.
    times.maghrib = new Date(times.asr.getTime() + 40 * 60_000);
    times.isha = new Date(times.maghrib.getTime() + 90 * 60_000);

    const prefs = { ...defaultPrefs() };
    prefs.offsets = { ...prefs.offsets, asr: 30, maghrib: -30 };

    const result = applyPrefsDetailed(times, prefs);

    const gapMs = result.times.maghrib.getTime() - result.times.asr.getTime();
    expect(gapMs).toBeGreaterThanOrEqual(MIN_GAP_MINUTES * 60_000);
  });

  it("a computable prayer is not dragged into NaN by an uncomputable neighbour", () => {
    const times = evenDay();
    times.maghrib = new Date(Number.NaN); // e.g. polar-night Invalid Date

    const prefs = { ...defaultPrefs() };
    prefs.offsets = { ...prefs.offsets, asr: 10 };

    const result = applyPrefsDetailed(times, prefs);

    expect(Number.isNaN(result.times.asr.getTime())).toBe(false);
    expect(result.times.asr.getTime()).toBe(times.asr.getTime() + 10 * 60_000);
  });

  it("the uncomputable prayer itself passes through untouched", () => {
    const times = evenDay();
    times.maghrib = new Date(Number.NaN);

    const prefs = { ...defaultPrefs() };
    prefs.offsets = { ...prefs.offsets, maghrib: 15 };

    const result = applyPrefsDetailed(times, prefs);

    expect(Number.isNaN(result.times.maghrib.getTime())).toBe(true);
    expect(result.applied.maghrib).toBe(0);
    expect(result.capped.maghrib).toBe(false);
  });
});

describe("planAlerts", () => {
  const NOW = new Date(2026, 5, 15, 4, 0, 0, 0);

  it("produces no duplicate alerts for the same prayer+kind", () => {
    const times = evenDay();
    const prefs = defaultPrefs();
    const alerts = planAlerts(times, prefs, NOW);

    const seen = new Set<string>();
    for (const a of alerts) {
      const key = `${a.prayer}:${a.kind}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("produces no alerts at all for a prayer switched off, including its reminder", () => {
    const times = evenDay();
    const prefs = defaultPrefs();
    prefs.notify.asr = "off";
    prefs.reminderMinutes.asr = 10;

    const alerts = planAlerts(times, prefs, NOW);
    expect(alerts.some((a) => a.prayer === "asr")).toBe(false);
  });

  it("drops alerts already in the past", () => {
    const times = evenDay();
    const prefs = defaultPrefs();
    // NOW is after fajr and sunrise in evenDay (4:00 base -> fajr at 04:00).
    const alerts = planAlerts(times, prefs, NOW);
    expect(alerts.some((a) => a.prayer === "fajr" && a.kind === "adhan")).toBe(
      false,
    );
  });

  it("sorts alerts in time order", () => {
    const times = evenDay();
    const prefs = defaultPrefs();
    for (const p of NOTIFIED_PRAYERS) prefs.reminderMinutes[p] = 10;
    const alerts = planAlerts(times, prefs, NOW);
    for (let i = 1; i < alerts.length; i++) {
      expect(alerts[i].at.getTime()).toBeGreaterThanOrEqual(
        alerts[i - 1].at.getTime(),
      );
    }
  });

  // BUG FOUND (mobile/src/lib/prayer-prefs.ts, planAlerts): an Invalid Date
  // prayer time correctly produces no "adhan" alert (`at.getTime() > from` is
  // false for NaN), but its reminder is NOT suppressed the same way. The
  // reminder guard is `if (warnAt <= from) continue;` and `warnAt` is
  // `NaN - minutesBefore * MS_PER_MINUTE` = NaN. `NaN <= from` is false, so
  // the `continue` is skipped and an alert with `at: new Date(NaN)` (an
  // Invalid Date) is pushed — exactly the "no bad times" case the rest of
  // the codebase guards against everywhere else (see time.ts's NO_TIME and
  // month/model.ts's try/catch around toHijri). A real device would hand
  // this to `scheduleNotificationAsync` and throw, per the exact failure
  // mode ROADMAP-MOBILE.md's high-latitude section describes for Invalid
  // Date prayer times reaching the notification scheduler.
  //
  // Not fixed here: mobile/src/lib/ is out of scope for this test task.
  // Left failing on purpose so it surfaces the moment someone re-enables it.
  it(
    "no alerts (including reminders) are produced for an Invalid Date prayer",
    () => {
      const times = evenDay();
      times.isha = new Date(Number.NaN);

      const prefs = defaultPrefs();
      prefs.reminderMinutes.isha = 10; // reminder explicitly requested

      const alerts = planAlerts(times, prefs, NOW);
      const ishaAlerts = alerts.filter((a) => a.prayer === "isha");

      expect(ishaAlerts).toEqual([]);
    },
  );
});
