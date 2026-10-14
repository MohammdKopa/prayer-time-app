import { describe, expect, it } from "vitest";

import {
  AFTER_PRAYER_STAGES,
  afterPrayerBoundary,
  afterPrayerStage,
} from "@/lib/tasbih-after-prayer";

// The tasbīḥ after prayer: 33 subḥān Allāh, 33 al-ḥamdu lillāh, 34 Allāhu
// akbar (Ṣaḥīḥ Muslim 596). The counter reads the phrase from the count, so
// the boundaries are what must not drift.

describe("tasbih after prayer", () => {
  it("is 33 · 33 · 34, a hundred in all", () => {
    expect(AFTER_PRAYER_STAGES.map((s) => s.count)).toEqual([33, 33, 34]);
  });

  it("says each phrase for its count, landing on 33/33 before moving on", () => {
    expect(afterPrayerStage(0)).toMatchObject({ stage: 0, inStage: 0, done: false });
    expect(afterPrayerStage(1)).toMatchObject({ stage: 0, inStage: 1 });
    expect(afterPrayerStage(33)).toMatchObject({ stage: 0, inStage: 33, stageCount: 33 });
    expect(afterPrayerStage(34)).toMatchObject({ stage: 1, inStage: 1 });
    expect(afterPrayerStage(66)).toMatchObject({ stage: 1, inStage: 33 });
    expect(afterPrayerStage(67)).toMatchObject({ stage: 2, inStage: 1, stageCount: 34 });
    expect(afterPrayerStage(100)).toMatchObject({ stage: 2, inStage: 34, done: true });
  });

  it("starts over after a hundred, for the next prayer", () => {
    expect(afterPrayerStage(101)).toMatchObject({ stage: 0, inStage: 1, done: false });
    expect(afterPrayerStage(200)).toMatchObject({ stage: 2, inStage: 34, done: true });
  });

  it("marks only the taps that finish a phrase", () => {
    const boundaries = [];
    for (let c = 1; c <= 200; c++) if (afterPrayerBoundary(c)) boundaries.push(c);
    expect(boundaries).toEqual([33, 66, 100, 133, 166, 200]);
  });

  it("carries the words exactly as fetched", () => {
    expect(AFTER_PRAYER_STAGES.map((s) => s.arabic)).toEqual([
      "سُبْحَانَ اللهِ",
      "الْحَمْدُ لِلهِ",
      "اللهُ أَكْبَرُ",
    ]);
  });
});
