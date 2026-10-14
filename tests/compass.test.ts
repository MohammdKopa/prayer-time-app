import { describe, expect, it } from "vitest";
import {
  adaptiveSmoothing,
  approachAngle,
  followAngle,
  shortestTurn,
} from "@/lib/compass";

describe("approachAngle", () => {
  it("holds still inside the deadband", () => {
    expect(approachAngle(10, 10.4)).toBe(10);
  });
  it("takes the short way across 0/360", () => {
    expect(approachAngle(359, 1, 0.5)).toBeCloseTo(360, 5);
  });
});

describe("adaptiveSmoothing", () => {
  it("is heavy for jitter and light for big turns", () => {
    expect(adaptiveSmoothing(0.5)).toBeCloseTo(0.12, 5);
    expect(adaptiveSmoothing(90)).toBeCloseTo(0.45, 5);
  });
  it("rises monotonically and ignores direction", () => {
    let prev = 0;
    for (let d = 0; d <= 40; d += 1) {
      const s = adaptiveSmoothing(d);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
    expect(adaptiveSmoothing(-20)).toBe(adaptiveSmoothing(20));
  });
});

describe("followAngle", () => {
  it("holds still for sub-deadband noise", () => {
    expect(followAngle(100, 100.4)).toBe(100);
  });
  it("converges on a large turn faster than the fixed 0.1 filter", () => {
    let a = 0;
    let b = 0;
    for (let i = 0; i < 5; i++) {
      a = followAngle(a, 90);
      b = approachAngle(b, 90);
    }
    expect(a).toBeGreaterThan(b);
    expect(a).toBeLessThanOrEqual(90);
  });
  it("never spins the long way round", () => {
    const a = followAngle(359, 2);
    expect(shortestTurn(359, a)).toBeGreaterThan(0);
    expect(a).toBeGreaterThan(359);
  });
});
