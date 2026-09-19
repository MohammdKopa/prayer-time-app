import { describe, expect, it } from "vitest";

import {
  alertIdentifier,
  HORIZON_DAYS,
  ID_PREFIX,
  isOrphanIdentifier,
  localDayKey,
  NOTIFIED,
  ownIdentifiers,
  PREVIEW_ID,
  scheduleFingerprint,
  type FingerprintInput,
} from "@/lib/adhan-schedule";

const BASE: FingerprintInput = {
  latitude: 51.6564,
  longitude: 7.0907,
  placeName: "Marl",
  prefsKey: '{"offsets":{}}',
  voice: "full",
  textSample: "أذان الفجر|تذكير|Marl · ",
  day: "2026-09-19",
};

describe("ownIdentifiers", () => {
  it("names every id any build has scheduled, once, all under the prefix", () => {
    const ids = ownIdentifiers();
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith(ID_PREFIX)).toBe(true);
    // 5 prayers × 7 days × (adhan, reminder, legacy) + the preview.
    expect(ids.length).toBe(NOTIFIED.length * HORIZON_DAYS * 3 + 1);
    expect(ids).toContain(PREVIEW_ID);
    expect(ids).toContain("adhan-maghrib-0"); // pre-reminder builds
    expect(ids).toContain(alertIdentifier("maghrib", "adhan", HORIZON_DAYS - 1));
    expect(ids).toContain(alertIdentifier("fajr", "reminder", 0));
  });

  it("never invents a sunrise alarm", () => {
    expect(ownIdentifiers().some((id) => id.includes("sunrise"))).toBe(false);
  });
});

describe("isOrphanIdentifier", () => {
  it("recognises the identifier-less leftovers of the first builds", () => {
    // Taken from `dumpsys activity intents` on the phone, 2026-09-19.
    expect(isOrphanIdentifier("fdb90a71-9968-401b-8667-860e6b5bf545")).toBe(true);
    expect(isOrphanIdentifier("E9E73067-F155-40D1-B01C-9223F19B7484")).toBe(true);
  });

  it("never matches ours or the dua reminders'", () => {
    for (const id of ownIdentifiers()) expect(isOrphanIdentifier(id)).toBe(false);
    expect(isOrphanIdentifier("adhkar-morning-0")).toBe(false);
    expect(isOrphanIdentifier("")).toBe(false);
  });
});

describe("scheduleFingerprint", () => {
  it("is stable for the same input", () => {
    expect(scheduleFingerprint(BASE)).toBe(scheduleFingerprint({ ...BASE }));
  });

  it("ignores GPS jitter inside a kilometre", () => {
    // Marl by hand vs. Marl by a fix a few streets over.
    const jittered = { ...BASE, latitude: 51.6571, longitude: 7.0912 };
    expect(scheduleFingerprint(jittered)).toBe(scheduleFingerprint(BASE));
  });

  it("changes when the place really moves", () => {
    const bochum = { ...BASE, latitude: 51.4818, longitude: 7.2162, placeName: "Bochum" };
    expect(scheduleFingerprint(bochum)).not.toBe(scheduleFingerprint(BASE));
    // Even the name alone: it is printed in the notification body.
    expect(scheduleFingerprint({ ...BASE, placeName: "Bochum" })).not.toBe(
      scheduleFingerprint(BASE),
    );
  });

  it("changes with everything that feeds the notifications", () => {
    const variants: Partial<FingerprintInput>[] = [
      { voice: "short" },
      { voice: "system" },
      { prefsKey: '{"offsets":{"asr":3}}' },
      { textSample: "Adhan Fajr|Reminder|Marl · " },
      { day: "2026-09-20" },
    ];
    for (const v of variants) {
      expect(scheduleFingerprint({ ...BASE, ...v })).not.toBe(scheduleFingerprint(BASE));
    }
  });
});

describe("localDayKey", () => {
  it("zero-pads and uses the local calendar", () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(localDayKey(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });
});
