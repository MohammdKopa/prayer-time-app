// When to ask for a store review. Pure — no React Native imports — so the
// rule is tested under node; the storage and the native call live in
// review-prompt-run.ts.

export interface ReviewState {
  /** Cold starts counted so far, this one included. */
  opens: number;
  /** ISO string or epoch ms of the very first open. */
  firstOpenAt: string | number;
  /** Set before the native call, so a crash in it cannot ask twice. */
  asked: boolean;
}

export const MIN_OPENS = 10;
export const MIN_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ask once: from the 10th open on, and only a week after the first. */
export function shouldAskForReview(state: ReviewState, now: number): boolean {
  if (state.asked) return false;
  if (state.opens < MIN_OPENS) return false;
  const first =
    typeof state.firstOpenAt === "number"
      ? state.firstOpenAt
      : Date.parse(state.firstOpenAt);
  if (!Number.isFinite(first)) return false;
  return now - first >= MIN_DAYS * DAY_MS;
}

/** Stored state from an older build, a corrupted store or nothing at all. */
export function parseReviewState(raw: unknown, now: number): ReviewState {
  const fresh: ReviewState = { opens: 0, firstOpenAt: now, asked: false };
  if (typeof raw !== "object" || raw === null) return fresh;
  const r = raw as Record<string, unknown>;
  const opens = r.opens;
  const first = r.firstOpenAt;
  return {
    opens:
      typeof opens === "number" && Number.isFinite(opens) && opens >= 0
        ? Math.floor(opens)
        : 0,
    firstOpenAt:
      typeof first === "string" || typeof first === "number" ? first : now,
    asked: r.asked === true,
  };
}
