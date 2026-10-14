// The guided tasbīḥ after prayer, as pure counting so it is tested under
// node; lib/tasbih.ts holds the session, storage and haptics.

/** The guided tasbīḥ after the obligatory prayer: 33 · 33 · 34, one phrase
 *  after the other. A sentinel, like FREE_TARGET, so the stored shape stays
 *  { count, target }. */
export const AFTER_PRAYER = -1;

// The set after prayer. Counts from Kaʿb ibn ʿUjra (Ṣaḥīḥ Muslim 596):
// "thirty-three tasbīḥa, thirty-three taḥmīda and thirty-four takbīra after
// every obligatory prayer" — https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=6259
// The words themselves, VERIFIED like lib/dua/content.ts (never typed: each
// is a byte-for-byte slice of the fetched text), from Samura ibn Jundab
// (Ṣaḥīḥ Muslim 2137), "the dearest words to Allah are four…" —
// https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=5475
export const AFTER_PRAYER_STAGES = [
  { arabic: "سُبْحَانَ اللهِ", count: 33 },
  { arabic: "الْحَمْدُ لِلهِ", count: 33 },
  { arabic: "اللهُ أَكْبَرُ", count: 34 },
] as const;
export const AFTER_PRAYER_TOTAL = 100;

export interface AfterPrayerStage {
  /** 0, 1 or 2: which phrase is being said. */
  stage: number;
  /** Position inside the phrase's count, 0 before its first tap. */
  inStage: number;
  stageCount: number;
  /** True on the tap that finishes the whole set of 100. */
  done: boolean;
}

/** Where a count stands in the set after prayer. Past 100 it starts over, so
 *  the counter keeps working after the next prayer without a reset. */
export function afterPrayerStage(count: number): AfterPrayerStage {
  const done = count > 0 && count % AFTER_PRAYER_TOTAL === 0;
  let left = done ? AFTER_PRAYER_TOTAL : count % AFTER_PRAYER_TOTAL;
  for (let stage = 0; stage < AFTER_PRAYER_STAGES.length; stage++) {
    const n = AFTER_PRAYER_STAGES[stage].count;
    const last = stage === AFTER_PRAYER_STAGES.length - 1;
    // Landing exactly on a phrase's count reads as 33/33 on that phrase; the
    // next tap opens the next one.
    if (left <= n || last) return { stage, inStage: left, stageCount: n, done };
    left -= n;
  }
  return { stage: 0, inStage: 0, stageCount: 33, done };
}

/** True when this count finishes a phrase (33, 66, 100, 133, …). */
export function afterPrayerBoundary(count: number): boolean {
  const s = afterPrayerStage(count);
  return count > 0 && s.inStage === s.stageCount;
}
