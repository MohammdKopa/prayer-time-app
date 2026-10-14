import { PAGE_STARTS, QUARTER_STARTS, SURAHS, type AyahRef } from "./meta";

// The Madani mushaf's 604 pages and 240 ḥizb quarters over AYAT offsets.
// Pure, no React Native, so the tests load it under node.

export const PAGE_COUNT = PAGE_STARTS.length;
export const AYAH_COUNT = 6236;

/** Index of the last entry in an ascending list that is ≤ value. */
function floorIndex(list: readonly number[], value: number): number {
  let lo = 0;
  let hi = list.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (list[mid] <= value) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

const SURAH_STARTS = SURAHS.map((s) => s.start);

/** The sūrah and āyah at an AYAT offset. */
export function refOfIndex(index: number): AyahRef {
  const s = floorIndex(SURAH_STARTS, index);
  return { surah: s + 1, ayah: index - SURAH_STARTS[s] + 1 };
}

/** AYAT offset of a sūrah/āyah (both clamped into range). */
export function indexOfRef(ref: AyahRef): number {
  const s = SURAHS[Math.min(114, Math.max(1, ref.surah)) - 1];
  return s.start + Math.min(s.ayahs, Math.max(1, ref.ayah)) - 1;
}

/** 1-based page that holds an AYAT offset. */
export function pageOfIndex(index: number): number {
  return floorIndex(PAGE_STARTS, index) + 1;
}

export function pageOf(ref: AyahRef): number {
  return pageOfIndex(indexOfRef(ref));
}

/** AYAT offsets on a page: [start, end). */
export function pageRange(page: number): { start: number; end: number } {
  const p = Math.min(PAGE_COUNT, Math.max(1, Math.round(page)));
  return {
    start: PAGE_STARTS[p - 1],
    end: p < PAGE_COUNT ? PAGE_STARTS[p] : AYAH_COUNT,
  };
}

/** 1-based ḥizb quarter (1–240) that holds an AYAT offset. */
export function quarterOfIndex(index: number): number {
  return floorIndex(QUARTER_STARTS, index) + 1;
}

export interface PageInfo {
  page: number;
  /** Juzʾ of the page's first āyah, as a printed mushaf heads the page. */
  juz: number;
  /** Ḥizb (1–60) of the page's first āyah. */
  hizb: number;
  /** Sūrahs with at least one āyah on the page, in order. */
  surahs: number[];
}

export function pageInfo(page: number): PageInfo {
  const { start, end } = pageRange(page);
  const q = quarterOfIndex(start);
  const first = refOfIndex(start).surah;
  const last = refOfIndex(end - 1).surah;
  const surahs: number[] = [];
  for (let s = first; s <= last; s++) surahs.push(s);
  return {
    page: Math.min(PAGE_COUNT, Math.max(1, Math.round(page))),
    juz: Math.ceil(q / 8),
    hizb: Math.ceil(q / 4),
    surahs,
  };
}

/** Quarter marks that begin on this page: the AYAT offset and which quarter
 *  of its ḥizb it opens (0 = a new ḥizb, 1–3 = ¼ ½ ¾). */
export function quarterMarksOn(page: number): { index: number; part: number; hizb: number }[] {
  const { start, end } = pageRange(page);
  const out: { index: number; part: number; hizb: number }[] = [];
  for (let q = quarterOfIndex(start); q <= QUARTER_STARTS.length; q++) {
    const at = QUARTER_STARTS[q - 1];
    if (at >= end) break;
    if (at >= start && at > 0) out.push({ index: at, part: (q - 1) % 4, hizb: Math.ceil(q / 4) });
  }
  return out;
}
