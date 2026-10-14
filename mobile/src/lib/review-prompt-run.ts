import * as StoreReview from "expo-store-review";

import {
  parseReviewState,
  shouldAskForReview,
  type ReviewState,
} from "@/lib/review-prompt";
import { loadJSON, saveJSON } from "@/lib/storage";

const KEY = "review-prompt";

// Long enough that the sheet never lands on the splash or the first frame.
const DELAY_MS = 4000;

// A mosque wall display opens the app often and must never show a rating
// sheet over the board; display.tsx sets this while it is mounted.
let displayActive = false;
export function setDisplayActive(active: boolean): void {
  displayActive = active;
}

/** Count this cold start and, once the rule says so, ask for a review through
 *  the system sheet. Never throws: a prayer clock does not fail over a rating. */
export async function countOpenAndMaybeAsk(): Promise<void> {
  try {
    const now = Date.now();
    const state = parseReviewState(await loadJSON<ReviewState>(KEY), now);
    // The first launch only starts the clock; it cannot qualify anyway.
    const next: ReviewState = { ...state, opens: state.opens + 1 };

    if (!shouldAskForReview(next, now)) {
      await saveJSON(KEY, next);
      return;
    }

    await saveJSON(KEY, next);
    setTimeout(() => {
      void (async () => {
        try {
          // Not on the wall display; a later ordinary open asks instead.
          if (displayActive) return;
          // Marked before the native call, so a crash in it cannot ask twice.
          await saveJSON(KEY, { ...next, asked: true });
          if (await StoreReview.isAvailableAsync()) {
            await StoreReview.requestReview();
          }
        } catch {
          // The sheet is a courtesy; skipping it is fine.
        }
      })();
    }, DELAY_MS);
  } catch {
    // as above
  }
}
