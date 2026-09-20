import { describe, expect, it } from "vitest";
import { countdownTo, formatCountdown, isValidTime } from "@/lib/time";

describe("isValidTime", () => {
  it("true for a normal Date", () => {
    expect(isValidTime(new Date(2026, 0, 1))).toBe(true);
  });

  it("false for an Invalid Date", () => {
    expect(isValidTime(new Date(Number.NaN))).toBe(false);
    expect(isValidTime(new Date("not a date"))).toBe(false);
  });
});

describe("countdownTo", () => {
  it("splits an exact future duration into hours/minutes/seconds", () => {
    const now = new Date(2026, 0, 1, 10, 0, 0, 0);
    const target = new Date(2026, 0, 1, 11, 23, 45, 0); // +1h23m45s
    const c = countdownTo(target, now);
    expect(c).toEqual({
      hours: 1,
      minutes: 23,
      seconds: 45,
      remainingMs: (1 * 3600 + 23 * 60 + 45) * 1000,
    });
  });

  it("clamps the displayed components at zero once the target has passed", () => {
    const now = new Date(2026, 0, 1, 12, 0, 0, 0);
    const target = new Date(2026, 0, 1, 11, 0, 0, 0); // 1h in the past
    const c = countdownTo(target, now);
    expect(c.hours).toBe(0);
    expect(c.minutes).toBe(0);
    expect(c.seconds).toBe(0);
    // but remainingMs still reports the true (negative) delta
    expect(c.remainingMs).toBe(-3600_000);
  });

  it("defaults `now` to the current time when omitted", () => {
    const target = new Date(Date.now() + 5000);
    const c = countdownTo(target);
    expect(c.remainingMs).toBeGreaterThan(0);
    expect(c.remainingMs).toBeLessThanOrEqual(5000);
  });
});

describe("formatCountdown", () => {
  it("omits hours when zero: MM:SS", () => {
    expect(formatCountdown({ hours: 0, minutes: 5, seconds: 9, remainingMs: 0 })).toBe(
      "05:09",
    );
  });

  it("includes hours, unpadded, when present: H:MM:SS", () => {
    expect(
      formatCountdown({ hours: 2, minutes: 3, seconds: 4, remainingMs: 0 }),
    ).toBe("2:03:04");
  });
});
