import type { StringKey } from "@/lib/i18n";

import { TAJWEED, TAJWEED_RULES, type TajweedRule } from "./tajweed";

// Tajweed colouring: which letters get which colour.
//
// Four families, as in the printed tajweed mushafs (Dar al-Maʿrifa style):
// madd in warm colours that deepen with length, the ghunna family in green,
// qalqala in blue, and what is written but not pronounced in grey. Gold stays
// the app's own accent and is never a tajweed colour.
//
// Every colour is opaque and was chosen against COLORS.bg — dimmed Arabic on
// Android shows seams at letter joins (see TEXT in theme.ts).

export type TajweedFamily = "maddLong" | "maddRequired" | "maddNecessary" | "ghunna" | "qalqala" | "silent";

/** null = not coloured. The natural madd (2) is left plain, as the printed
 *  tajweed mushafs leave it: it is the default length, and colouring it would
 *  put a colour on nearly every word. */
export const FAMILY_OF: Record<TajweedRule, TajweedFamily | null> = {
  madd_2: null,
  madd_246: "maddLong",
  madd_munfasil: "maddRequired",
  madd_muttasil: "maddRequired",
  madd_6: "maddNecessary",
  ghunnah: "ghunna",
  idghaam_ghunnah: "ghunna",
  idghaam_shafawi: "ghunna",
  ikhfa: "ghunna",
  ikhfa_shafawi: "ghunna",
  iqlab: "ghunna",
  qalqalah: "qalqala",
  hamzat_wasl: "silent",
  lam_shamsiyyah: "silent",
  silent: "silent",
  idghaam_no_ghunnah: "silent",
  idghaam_mutajanisayn: "silent",
  idghaam_mutaqaribayn: "silent",
};

// The madd reds follow the muṣḥaf's gradient: the longer the madd, the
// deeper the red (salmon 2/4/6 → crimson 4–5 → wine 6), lifted enough to
// stay legible on the dark page (contrast ≈ 7.6 / 5.2 / 3.9 against bg).
export const FAMILY_COLOR: Record<TajweedFamily, string> = {
  maddLong: "#F7866E",
  maddRequired: "#F2485B",
  maddNecessary: "#C93A72",
  ghunna: "#4CC879",
  qalqala: "#55B4F2",
  silent: "#7D847E",
};

/** Legend order, with the label each family shows under. */
export const LEGEND: { family: TajweedFamily; label: StringKey }[] = [
  { family: "maddLong", label: "tajweedMadd246" },
  { family: "maddRequired", label: "tajweedMadd45" },
  { family: "maddNecessary", label: "tajweedMadd6" },
  { family: "ghunna", label: "tajweedGhunna" },
  { family: "qalqala", label: "tajweedQalqala" },
  { family: "silent", label: "tajweedSilent" },
];

/** Combining marks (Unicode Mn): ḥarakāt, tanwīn, shadda, sukūn, maddah,
 *  superscript alif, small high letters, pause marks (U+0610–061A,
 *  064B–065F, 0670, 06D6–06DC, 06DF–06E4, 06E8, 06EA–06ED, 08F0–08FF).
 *  Not marks: the small wāw and yāʾ of the madd ṣila (ۥ ۦ ۧ, U+06E5–06E7),
 *  which are spacing letters, as in لَهُۥ. */
const MARK = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۨ-ࣰۭ-ࣿ]/;

/**
 * Rules about two letters meeting — a nūn sākina, tanwīn or mīm sākina and
 * the letter after it. The data marks the whole meeting, from the source
 * letter into the next one; a tajweed mushaf colours the source letter only,
 * and so does the reader.
 */
const SOURCE_LETTER_ONLY = new Set<TajweedRule>([
  "ikhfa",
  "ikhfa_shafawi",
  "iqlab",
  "idghaam_ghunnah",
  "idghaam_no_ghunnah",
  "idghaam_shafawi",
  "idghaam_mutajanisayn",
  "idghaam_mutaqaribayn",
]);

/** The boundary at or after `i`, stepping forward over marks. */
function clusterEnd(text: string, i: number): number {
  while (i < text.length && MARK.test(text[i])) i++;
  return i;
}

/** Where the source of a meeting ends: at the end of its word if the meeting
 *  crosses one, otherwise after the first letter and its marks. */
function sourceLetterEnd(text: string, start: number, end: number): number {
  const space = text.indexOf(" ", start);
  if (space !== -1 && space < end) {
    let e = space;
    // A pause mark written before the space stays plain.
    while (e > start && /[ۖ-۞\s]/.test(text[e - 1])) e--;
    return e;
  }
  let i = start;
  while (i < end && MARK.test(text[i])) i++; // marks before the first letter
  return clusterEnd(text, Math.min(i + 1, end));
}

/** The first letter (not a mark, not a space) in [from, to), or -1. */
function nextLetter(text: string, from: number, to: number): number {
  for (let i = from; i < to; i++) {
    if (!MARK.test(text[i]) && !/\s/.test(text[i])) return i;
  }
  return -1;
}

export interface Segment {
  text: string;
  family: TajweedFamily | null;
}

/**
 * An āyah cut into coloured and plain runs, for the tajweed page (a browser
 * engine, which shapes whole words and can colour a single mark). `from`
 * skips a prefix (the basmala shown as a header) without moving any span.
 * Joined back together, the segments are exactly `ayahText.slice(from)`.
 */
export function tajweedSegments(ayahIndex: number, ayahText: string, from = 0): Segment[] {
  const row = TAJWEED[ayahIndex] ?? [];
  const out: Segment[] = [];
  let at = from;
  const push = (end: number, family: TajweedFamily | null) => {
    if (end <= at) return;
    const text = ayahText.slice(at, end);
    const last = out[out.length - 1];
    if (last && last.family === family) last.text += text;
    else out.push({ text, family });
    at = end;
  };
  for (let k = 0; k < row.length; k += 3) {
    const rule = TAJWEED_RULES[row[k]];
    const family = FAMILY_OF[rule];
    if (!family) continue;
    // The data often opens a span on the vowel *before* the letter the rule
    // is about (the fatḥa of شَ in شَآءَ for the madd on آ): such a span
    // starts at its first letter. A meeting starts where the data says — on
    // the nūn, the mīm, or the tanwīn mark itself. A span ends after the
    // marks of its last letter.
    const firstLetter = nextLetter(ayahText, row[k + 1], row[k + 2]);
    const rawStart =
      firstLetter !== -1 && !SOURCE_LETTER_ONLY.has(rule) ? firstLetter : row[k + 1];
    const start = Math.max(rawStart, at);
    const end = SOURCE_LETTER_ONLY.has(rule)
      ? sourceLetterEnd(ayahText, start, clusterEnd(ayahText, row[k + 2]))
      : clusterEnd(ayahText, row[k + 2]);
    if (end <= start) continue; // inside the skipped prefix, or overlapped
    push(start, null);
    if (rule === "idghaam_ghunnah") {
      // As in the muṣḥaf: the merged nūn is not pronounced (grey); the
      // ghunna sits on the letter it merges into (green), as in مَن يَشۡتَرِي.
      push(end, "silent");
      const spanEnd = clusterEnd(ayahText, row[k + 2]);
      const target = nextLetter(ayahText, at, spanEnd);
      if (target === -1) continue;
      push(target, null);
      push(clusterEnd(ayahText, target + 1), "ghunna");
      continue;
    }
    push(end, family);
  }
  push(ayahText.length, null);
  return out;
}
