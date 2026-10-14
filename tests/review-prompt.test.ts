import { describe, expect, it } from "vitest";

import {
  parseReviewState,
  shouldAskForReview,
  type ReviewState,
} from "@/lib/review-prompt";

const DAY = 24 * 60 * 60 * 1000;
const FIRST = Date.UTC(2026, 9, 1);

function state(over: Partial<ReviewState>): ReviewState {
  return { opens: 1, firstOpenAt: FIRST, asked: false, ...over };
}

describe("shouldAskForReview", () => {
  it("does not ask on the first launch", () => {
    expect(shouldAskForReview(state({ opens: 1 }), FIRST)).toBe(false);
  });

  it("does not ask at 9 opens, however old the install", () => {
    expect(shouldAskForReview(state({ opens: 9 }), FIRST + 30 * DAY)).toBe(false);
  });

  it("does not ask at 10 opens inside the first week", () => {
    expect(shouldAskForReview(state({ opens: 10 }), FIRST + 7 * DAY - 1)).toBe(false);
  });

  it("asks at 10 opens and 7 days", () => {
    expect(shouldAskForReview(state({ opens: 10 }), FIRST + 7 * DAY)).toBe(true);
  });

  it("accepts an ISO first-open date", () => {
    const s = state({ opens: 12, firstOpenAt: new Date(FIRST).toISOString() });
    expect(shouldAskForReview(s, FIRST + 8 * DAY)).toBe(true);
  });

  it("never asks again once asked", () => {
    const s = state({ opens: 50, asked: true });
    expect(shouldAskForReview(s, FIRST + 90 * DAY)).toBe(false);
  });

  it("does not ask on an unreadable date", () => {
    expect(shouldAskForReview(state({ opens: 10, firstOpenAt: "nope" }), FIRST + 30 * DAY)).toBe(false);
  });
});

describe("parseReviewState", () => {
  it("starts fresh from nothing or junk", () => {
    expect(parseReviewState(null, FIRST)).toEqual({ opens: 0, firstOpenAt: FIRST, asked: false });
    expect(parseReviewState("x", FIRST).opens).toBe(0);
  });

  it("keeps good stored values and repairs bad fields", () => {
    expect(parseReviewState({ opens: 4, firstOpenAt: 5, asked: true }, FIRST)).toEqual({
      opens: 4,
      firstOpenAt: 5,
      asked: true,
    });
    expect(parseReviewState({ opens: -3, asked: "yes" }, FIRST)).toEqual({
      opens: 0,
      firstOpenAt: FIRST,
      asked: false,
    });
  });
});
