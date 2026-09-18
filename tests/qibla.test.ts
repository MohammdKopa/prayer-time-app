// True bearings computed independently (great-circle initial-bearing formula,
// not going through the qibla.ts/adhan code under test) toward the Kaaba
// (21.4225N, 39.8262E):
//
//   Marl (51.6564N, 7.0907E)   -> 127.593°
//   Berlin (52.52N, 13.405E)   -> 136.685°
//
// Note: the task brief guessed Marl's bearing at "~130-135°"; the actual
// great-circle bearing is ~127.6°, confirmed by two independent
// calculations (this file's own formula and shared/qibla.ts's adhan-backed
// one agree to within 0.001°) — so the assertion below uses the verified
// value rather than the brief's estimate.

import { describe, expect, it } from "vitest";
import { bearingLabelAr, qiblaBearing } from "@shared/qibla";

function closeTo(actual: number, expected: number, toleranceDeg: number) {
  const diff = Math.abs(((actual - expected + 540) % 360) - 180);
  expect(diff).toBeLessThanOrEqual(toleranceDeg);
}

describe("qiblaBearing", () => {
  it("Marl: ~127.6° ± 1°", () => {
    closeTo(qiblaBearing(51.6564, 7.0907), 127.593, 1);
  });

  it("Berlin: ~136.7° ± 1°", () => {
    closeTo(qiblaBearing(52.52, 13.405), 136.685, 1);
  });

  it("due north of Mecca on the same meridian: bearing is due south (180°)", () => {
    closeTo(qiblaBearing(22.4225, 39.8262), 180, 1);
  });

  it("due south of Mecca on the same meridian: bearing is due north (0°/360°)", () => {
    closeTo(qiblaBearing(20.4225, 39.8262), 0, 1);
  });

  it("returns a value in [0, 360)", () => {
    for (const [lat, lng] of [
      [51.6564, 7.0907],
      [-33.8688, 151.2093], // Sydney
      [40.7128, -74.006], // New York
    ]) {
      const b = qiblaBearing(lat, lng);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });
});

describe("bearingLabelAr", () => {
  it("maps the four cardinal directions", () => {
    expect(bearingLabelAr(0)).toBe("شمال");
    expect(bearingLabelAr(90)).toBe("شرق");
    expect(bearingLabelAr(180)).toBe("جنوب");
    expect(bearingLabelAr(270)).toBe("غرب");
  });

  it("wraps bearings outside [0, 360) the same as inside it", () => {
    expect(bearingLabelAr(360)).toBe(bearingLabelAr(0));
    expect(bearingLabelAr(-90)).toBe(bearingLabelAr(270));
    expect(bearingLabelAr(720 + 45)).toBe(bearingLabelAr(45));
  });

  it("Marl's actual qibla bearing (~127.6°) labels as south-east", () => {
    expect(bearingLabelAr(qiblaBearing(51.6564, 7.0907))).toBe("جنوب شرق");
  });
});
